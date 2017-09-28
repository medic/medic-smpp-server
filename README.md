`medic-smpp-server`
===================

Prototype SMPP server which implements the `medic-gateway` protocol to send and receive messages from `medic-webapp` via `medic-api` through an SMPP server.

For a production system, the `medic-gateway` protocol may not be ideal because it assumes that the client is deferring as much responsibility as possible to the server.
