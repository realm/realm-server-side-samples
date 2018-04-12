//
//  ViewController.swift
//  RealmJWTSample
//
//  Created by Maximilian Alexander on 4/10/18.
//  Copyright © 2018 Maximilian Alexander. All rights reserved.
//

import UIKit
import Eureka
import Alamofire
import RealmSwift

class LoginViewController: FormViewController {

    static let CUSTOM_USERNAME = "CUSTOM_USERNAME"
    static let CUSTOM_PASSWORD = "CUSTOM_PASSWORD"
    static let CUSTOM_PIN = "CUSTOM_PIN"
    static let IS_ADMIN = "IS_ADMIN"
    static let BUTTON_ROW = "BUTTON_ROW"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        title = "Realm JWT Login Example"
        
        form +++ Section()
            <<< TextRow(LoginViewController.CUSTOM_USERNAME) { row in
                row.title = "Custom Username:"
                row.cell.textField.autocorrectionType = .no
                row.cell.textField.autocapitalizationType = .none
            }
            <<< PasswordRow(LoginViewController.CUSTOM_PASSWORD) { row in
                row.title = "Custom Password:"
            }
            <<< IntRow(LoginViewController.CUSTOM_PIN) { row in
                row.title = "Custom Pin:"
                row.useFormatterDuringInput = false
            }
            +++ Section()
            <<< SwitchRow(LoginViewController.IS_ADMIN) { row in
                row.title = "Is Admin:"
            }
            +++ Section()
            <<< ButtonRow(LoginViewController.BUTTON_ROW) { row in
                row.title = "Login"
            }
            .onCellSelection({ [weak self] (_, _) in
                    self?.loginButtonDidClick()
            })
        // Do any additional setup after loading the view, typically from a nib.
    }

    func loginButtonDidClick() {
        let customUsername = form.values()[LoginViewController.CUSTOM_USERNAME] as? String ?? ""
        let customPassword = form.values()[LoginViewController.CUSTOM_PASSWORD] as? String ?? ""
        let customPin = String((form.values()[LoginViewController.CUSTOM_PIN] as? Int ?? 0))
        let isAdmin = form.values()[LoginViewController.IS_ADMIN] as? Bool ?? false
        
        let buttonRow: ButtonRow = self.form.rowBy(tag: LoginViewController.BUTTON_ROW)!
        buttonRow.disabled = true
        buttonRow.evaluateDisabled()
        
        let payload: [String: Any] = [
            "customUsername": customUsername,
            "customPassword": customPassword,
            "customPin": customPin,
            "isAdmin": isAdmin
        ]
        
        Alamofire
            .request("http://localhost:8080/custom-login", method: .post, parameters: payload, encoding: JSONEncoding.default)
            .responseJSON { [weak self] (response) in
                
                buttonRow.disabled = false
                buttonRow.evaluateDisabled()
                
                if let status = response.response?.statusCode, let json = response.result.value as? NSDictionary {
                    switch(status) {
                    case 200:
                        let token = json["jwtToken"] as! String
                        self?.loginToROS(jwtToken: token)
                        break
                    case 400:
                        let message = json["message"] as! String
                        let alert = UIAlertController(title: "Uh Oh", message: message, preferredStyle: .alert)
                        alert.addAction(UIAlertAction(title: "Okay!", style: .default, handler: nil))
                        self?.present(alert, animated: true, completion: nil)
                        break
                    case 401:
                        let message = json["message"] as! String
                        let alert = UIAlertController(title: "Uh Oh", message: message, preferredStyle: .alert)
                        alert.addAction(UIAlertAction(title: "Okay!", style: .default, handler: nil))
                        self?.present(alert, animated: true, completion: nil)
                        break
                    default:
                        break
                    }
                } else {
                    let alert = UIAlertController(title: "Uh Oh", message: "Oh no something bad happened. Check the debug.", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "Okay!", style: .default, handler: nil))
                    self?.present(alert, animated: true, completion: nil)
                }
            }
    }
    
    func loginToROS(jwtToken: String) {
        let buttonRow: ButtonRow = self.form.rowBy(tag: LoginViewController.BUTTON_ROW)!
        buttonRow.disabled = true
        buttonRow.evaluateDisabled()
        
        let jwtCreds = SyncCredentials.jwt(jwtToken)
        SyncUser.logIn(with: jwtCreds, server: URL(string: "http://localhost:9080")!) { [weak self] (user, err) in
            guard let `self` = self else  { return }
            buttonRow.disabled = false
            buttonRow.evaluateDisabled()
            if let error = err {
                let alert = UIAlertController(title: "Uh Oh", message: error.localizedDescription, preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "Okay!", style: .default, handler: nil))
                self.present(alert, animated: true, completion: nil)
            } else if let _ = user {     
                self.navigationController?.setViewControllers([MainViewController()], animated: true)
            }
        }
        
    }

}

