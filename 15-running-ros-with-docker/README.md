# 15. Running ROS with Docker

The following example shows you how to build a very basic ROS instance with a dockerfile.  You can use this as a getting started template for adding more customizations.  By default, this includes the Realm GraphQL Service which exposes ROS as a REST endpoint.  Authentication is disabled by default.  This can be easily edited via the index.js file or removed entirely.  (More details on GraphQL here)[https://docs.realm.io/platform/graphql-web-access]   

To get started: 
1) Open up the index.js and insert your ROS feature token 
2) Modify the package.json (if desired) to include additional packages or a specific version of ROS
3) Build the dockerfile (like `docker build -t my-ros .` )
4) Run your new docker image: `docker run -p 9080:9080 my-ros`
5) Connect to your instance using Realm Studio (or a client script).  Remember that you can initially use the default username + password of the realm-admin 