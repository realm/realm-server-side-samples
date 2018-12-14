// Create the object
RLMLoginViewController *loginController = [[RLMLoginViewController alloc] initWithStyle:LoginViewControllerStyleLightTranslucent];

// Configure any of the inputs before presenting it
loginController.serverURL = @"localhost";

// Set a closure that will be called on successful login
loginController.loginSuccessfulHandler = ^(RLMSyncUser *user) {
	// Provides the successfully authenticated RLMSyncUser object
};