# API Endpoints Critique

Link to REST service: https://marina-db.appspot.com/

## Edit a Boat
`PATCH /boats/:boat_id`

Editing a resource comes down to two choices of HTTP verbs: `PUT` or `PATCH`. The specification for editing a boat requires that all three properties&mdash;`name`, `type`, and `length`&mdash; must be present in the body. This means that on update, the boat's properties are *replaced*, regardless of whether they differ from those in the request body. A PUT request would be more appropriate. From the article [REST &ndash; PUT vs POST](https://restfulapi.net/rest-put-vs-post/): "PUT replaces the resource in its entirety. Use PATCH if request updates part of the resource."

The URI is clear and succint; it identifies a resource of the type `boat` and an ID to locate it.

## A Boat Arrives at a Slip
`PUT /slips/:slip_id/:boat_id`

From the critique of the endpoint for editing a boat, one can argue that a `PATCH` request is more fitting, as the action partially updates the slip. However, the API needs to distinguish between this endpoint and that for a boat departing a slip. Thus, a `PUT` vs `DELETE` request is clearer.

The URI is ambiguous regarding which ID should come first, the slip's or the boat's. Though it identifies a resource of type `slip`, it doesn't clarify which type the second ID should be. This is error prone for the user. It would be clearer like this:

`PUT /slips/:slip_id/boats/:boat_id`

## A Boat Departing a Slip
`DELETE /slips/:slip_id/:boat_id`

As mentioned in the critique of the endpoint for a boat arriving at a slip, a `DELETE` request is clearer than a `PATCH` request. However, the URI suffers from the same ambiguity as the `PUT` request counterpart. This would be clearer:

`DELETE /slips/:slip_id/boats/:boat_id`