#import <UIKit/UIKit.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

@end
```
{% endcode-tabs-item %}
{% endcode-tabs %}

{% code-tabs %}
{% code-tabs-item title="AppDelegate.m" %}
```objectivec
#import "AppDelegate.h"

@import Realm;
@import Realm.Dynamic;
@import Realm.Private;

@interface AppDelegate ()

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {

    NSString *sourceFilePath = [[NSBundle mainBundle] pathForResource:@"fieldFlow" ofType:@"realm"];

    RLMRealmConfiguration *configuration = [[RLMRealmConfiguration alloc] init];
    configuration.fileURL = [NSURL URLWithString:sourceFilePath];
    configuration.dynamic = true;
    configuration.readOnly = YES;

    RLMRealm *localRealm = [RLMRealm realmWithConfiguration:configuration error:nil];

    RLMSyncCredentials *creds = [RLMSyncCredentials credentialsWithUsername:@"admin@realm.io" password:@"password" register:NO];
    [RLMSyncUser logInWithCredentials:creds authServerURL:[NSURL URLWithString:@"http://localhost:9080"] onCompletion:^(RLMSyncUser *syncUser, NSError *error) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self copyToSyncRealmWithRealm: localRealm user:syncUser];
        });
    }];

    return YES;
}

- (void)copyToSyncRealmWithRealm:(RLMRealm *)realm user:(RLMSyncUser *)user
{
    RLMRealmConfiguration *syncConfig = [[RLMRealmConfiguration alloc] init];
    syncConfig.syncConfiguration = [[RLMSyncConfiguration alloc] initWithUser:user realmURL:[NSURL URLWithString:@"realm://localhost:9080/~/fieldRow"]];
    syncConfig.customSchema = [realm.schema copy];

    RLMRealm *syncRealm = [RLMRealm realmWithConfiguration:syncConfig error:nil];
    syncRealm.schema = syncConfig.customSchema;

    [syncRealm transactionWithBlock:^{
        NSArray *objectSchema = syncConfig.customSchema.objectSchema;
        for (RLMObjectSchema *schema in objectSchema) {
            RLMResults *allObjects = [realm allObjects:schema.className];
            for (RLMObject *object in allObjects) {
                RLMCreateObjectInRealmWithValue(syncRealm, schema.className, object, true);
            }
        }
    }];
}