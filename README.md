# Private File Sharing Tool for Internal and External Users in AWS
The goal of this application is to share the files (images,docs,spreadsheets,audio etc) between internal and external users privately. The following AWS Resources have been used while building this application:
- IAM 
  - IAM Role: To assume after login.
  - IAM SAML Provider: With ADFS Federation Metadata.
- S3 Bucket: To upload and share the files.
- AWS Cognito User Pool: To create external users.
- AWS Cognito Federated Identity Pool: For the authentication providers (SAML and Cognito User Pool).
- AWS EC2 Ubuntu Server: The application code is kept and serve through a web server.
- AWS EC2 Windows Server: Managing Active Directory and ADFS for Internal Users.

The intention is to create a simple web app that has the following features:
- The users will be able to view the contents of their particular bucket and a shared bucket. Users will not be able to access the buckets which are own by other users.
- The internal users i.e. AD Users will be able to view, upload and share the selected files to any user internally or externally.
- The external users i.e. Cognito Users will be able to view and share the selected files to any user internally or externally.
- After login, the user will get the temporary credentials so that he/she will be able to access the bucket.
- Once a file is shared with a user, he/she will get a download link on his/her email address. Also, the file will get copied to his/her folder in the same S3 bucket. For example, if userA is sharing a fileA to userB (userb@gmail.com), the fileA will get copied to userB’s folder i.e. the structure of the bucket will be: s3bucket/userb@gmail.com/usera@gmail.com/fileA.
- The download link will be sent to the email address based on the user is already registered or not.
- If registered, the user will be asked to enter the credentials with MFA to download the file.
- It not already registered, the user will be redirected to the registration page. Once registered, the user will be asked to reenter his/her credentials to download the file.

## How to make it work
Clone the Repo. Specify the correct parameters in js/aws/awsConfig.js. Serve the Document Root Location through a Web Server.
In our case, we have tested on an Ubuntu Server and configured Nginx Web Server to serve the application.
Also, an api (code exists in api directory in the repo) has been used to authenticate and redirect the AD users to the correct page. Start the api using below command:
```
node server.js
```
The api starts listening on 8443 port.
