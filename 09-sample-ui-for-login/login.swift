// Create the object
let loginController = LoginViewController(style: .lightTranslucent) // init() also defaults to lightTranslucent

// Configure any of the inputs before presenting it
loginController.serverURL = "localhost"

// Set a closure that will be called on successful login
loginController.loginSuccessfulHandler = { user in
	// Provides the successfully authenticated SyncUser object
}