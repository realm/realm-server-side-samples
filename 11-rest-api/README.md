# 11. REST API calls with the Global Notifier

This example shows how to use the Global Notifier to dispatch REST JSON HTTP requests. 

Important notes:

1. The client is responsible for deleting the `request` and it's coresponding `response` object when the response is complete. This is pretty critical to keeping the global notifier fresh. of checking each realm object. 
2. This solution gives you offline-first http requests, but you will need to scale out the instances running the global notifier as it becomes the bottle neck for dispatching all the requests. 

Run `npm install` and then when done run `npm start`. This example has a running express server. 
