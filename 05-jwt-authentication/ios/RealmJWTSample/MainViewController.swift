//
//  MainViewController.swift
//  RealmJWTSample
//
//  Created by Maximilian Alexander on 4/12/18.
//  Copyright © 2018 Maximilian Alexander. All rights reserved.
//

import UIKit
import RealmSwift

class MainViewController: UIViewController {
    
    lazy var titleLabel: UILabel = {
        let t = UILabel()
        t.text = "You're Logged In with JWT!"
        t.translatesAutoresizingMaskIntoConstraints = false
        return t
    }()
    

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        title = "Welcome!"
        
        view.addSubview(titleLabel)
        
        let hConstraints = NSLayoutConstraint.constraints(withVisualFormat: "H:|-16-[titleLabel]-16-|", options: [], metrics: nil, views: [
            "titleLabel": titleLabel
            ])
        
        let vConstraints = NSLayoutConstraint.constraints(withVisualFormat: "V:|-16-[titleLabel]-16-|", options: [], metrics: nil, views: [
            "titleLabel": titleLabel
            ])
        
        view.addConstraints(hConstraints)
        view.addConstraints(vConstraints)
        
        let logoutButton = UIBarButtonItem(title: "Logout", style: .plain, target: self, action: #selector(MainViewController.logoutButtonDidClick))
        self.navigationItem.rightBarButtonItem = logoutButton
    }

    @objc func logoutButtonDidClick() {
        SyncUser.current?.logOut()
        self.navigationController?.setViewControllers([LoginViewController()], animated: true)
    }

}
