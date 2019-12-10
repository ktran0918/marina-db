# API Description

URL: https://marina-db2.appspot.com

## Authentication
Login is done on the application's home page (see above)

## Non-User Entities
These consist of boats and loads. A boat carries loads, and it has a one-to-many relationship with loads. However, the same load cannot be carried by more than one boat. Upon a boat's deletion, all of its loads are unloaded. Upon a load's deletion, it is unloaded from a boat.

## User Entities
Aside from the recording-keeping ID given to a user entity by Google Datastore, a "sub" value obtained from a JWT obtained for the user from Google API identifies that user. This value is also stored as the owner ID of a boat. There's a GET request in the API that retrieves boats owned by a specific user. This needs the user ID to be specified (this will be described in detail below). The user must retrieve their ID from some source, either by decoding their JWT or copying it from a boat entity.

A user has a one-to-many relationship with boats. The user resource, however, does not store a list of boats. Upon a boat's deletion, its owner record is simply deleted with the rest of the data.

# API Spec

## Common Behavior
Listed below are behaviors common to several endpoints:

- Any request to endpoints that access a boat entity, a protected resource, must have a valid JWT. A non-existent or invalid JWT will result in a 401 status code.
- The response body (if available) is limited to JSON. Any request specifying a different Accept format will be rejected with a 406 status code and message "The requested content type is not available."

## Create a boat
`POST /boats`

Authentication is required.

### Request

#### Request Parameters
None

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name   | Type    | Description        | Constraint                                                                                                                                                             | Required? |
| ------ | ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| name   | String  | Name of the  boat  | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes       |
| type   | String  | Type of the boat   | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes       |
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet.                                                                                                                               | Yes       |

#### Request Body Example
```json
{
	"name": "Fisherman Pro-3000",
	"type": "Fishing boat",
	"length": 30
}
```

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code                | Notes                                                                                                |
| ------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| Success | 201 Created                |
| Failure | 401 Unauthorized           | The bearer token supplied is non-existent or invalid.                                                |
| Failure | 400 Bad Request            | The request object contains attributes other than name, type, and length (e.g. color, manufacturer). |
| Failure | 400 Bad Request            | The name is invalid.                                                                                 |
| Failure | 400 Bad Request            | The type is invalid.                                                                                 |
| Failure | 400 Bad Request            | The length is invalid.                                                                               |
| Failure | 400 Bad Request            | The request object is missing at least one of the required attributes.                               |
| Failure | 403 Forbidden              | A boat of the same name already exists.                                                              |
| Failure | 415 Unsupported Media Type | Request body is not in JSON format.                                                                  |
| Failure | 406 Not Acceptable         | The requested content type is not available.                                                         |

#### Response Examples
Success - 201 Created
```json
{
    "id": "5698529657880576",
    "name": "Fisherman Pro-3000",
    "type": "Fishing boat",
    "length": 30,
    "self": "https://marina-db.appspot.com/boats/5698529657880576"
}
```

Failure - 415 Unsupported Media Type
```json
{
    "Error": "Server only accepts application/json data"
}
```


## List all Boats
`GET /boats`

### Request

#### Request Parameters
None

#### Request Headers
| Name   | Type   | Description                                      | Required |
| ------ | ------ | ------------------------------------------------ | -------- |
| cursor | String | The cursor indicating the next items in the list | No       |


### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                        |
| ------- | ------------------ | -------------------------------------------- |
| Success | 200 OK             |
| Failure | 406 Not Acceptable | The requested content type is not available. |

#### Response Examples
Success - 200 OK
```json
{"items":
    [
        {
            "id": "abc123",
            "name": "Sea Witch",
            "type": "Catamaran",
            "length": 28,
            "self": "https://<your-app>/boats/abc123"
        },
        {
            "id": "def456",
            "name": "Adventure",
            "type": "Sailboat",
            "length": 50,
            "self": "https://<your-app>/boats/def456"
        },
        {
            "id": "xyz123",
            "name": "Hocus Pocus",
            "type": "Sailboat",
            "length": 100,
            "self": "https://<your-app>/boats/xyz123"
        }
    ],
    "next": "https://marina-db.appspot.com/boats?cursor=CiYSIGoLbX5tYXJpbmEtZGJyEQsSBEJvYXQYgICAkPCWhgoMGAAgAA==",
    "totalCount": 6
}
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## Get a Boat
`GET /boats/:boat_id`

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |

#### Request Body
None

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                                 |
| ------- | ------------------ | ----------------------------------------------------- |
| Success | 200 OK             |
| Failure | 401 Unauthorized   | The bearer token supplied is non-existent or invalid. |
| Failure | 406 Not Acceptable | The requested content type is not available.          |
| Failure | 404 Not Found      | No boat with this boat_id exists.                     |

#### Response Examples
Success - 200 OK
```json
{
    "id": "4824175986343936",
    "name": "Fisherman Pro-3000",
    "type": "Fishing boat",
    "length": 30,
    "owner": "100887166893029001406",
    "self": "https://marina-db2.appspot.com/boats/4824175986343936"
}
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## Edit a boat (PATCH)
`PATCH /boats/:boat_id`

Authentication is required.

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name   | Type    | Description        | Constraint                                                                                                                                                             | Required? |
| ------ | ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| name   | String  | Name of the  boat  | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes*      |
| type   | String  | Type of the boat   | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes*      |
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet.                                                                                                                               | Yes*      |

\* At least one required attribute must be present, but it is not necessary for all three attributes to be present.

#### Request Body Example
```json
{
	"length": 100
}
```

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code                | Notes                                                                                               |
| ------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Success | 200 OK                     |
| Failure | 401 Unauthorized           | The bearer token supplied is non-existent or invalid.                                               |
| Failure | 400 Bad Request            | The request object contains attributes other than name, type, and length (e.g. color, manufacturer) |
| Failure | 400 Bad Request            | The name is invalid.                                                                                |
| Failure | 400 Bad Request            | The type is invalid.                                                                                |
| Failure | 400 Bad Request            | The length is invalid.                                                                              |
| Failure | 400 Bad Request            | The request object is missing a required attribute.                                                 |
| Failure | 415 Unsupported Media Type | Request body is not in JSON format.                                                                 |
| Failure | 403 Forbidden              | No boat with this boat_id exists, or the boat belongs to another user                               |
| Failure | 403 Forbidden              | A boat of the same name already exists.                                                             |
| Failure | 406 Not Acceptable         | The requested content type is not available.                                                        |

#### Response Examples
Success - 200 OK
```json
{
    "id": "5072049319968768",
    "name": "Fisherman3000",
    "type": "Fishing boat",
    "length": 100,
    "self": "https://marina-db.appspot.com/boats/5072049319968768"
}
```

Failure - 400 Bad Request
```json
{
    "Error": "The request object is missing a required attribute"
}
```


## Edit a boat (PUT) 
`PUT /boats/boat_id`

Authentication is required.

Similar in functionality to the PATCH request, with a couple of differences:
- The request body must have all three required attributes (name, type, length).
- Success returns the status code **303 See Other** and the URL to the boat in the header's Location attribute.

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name   | Type    | Description        | Constraint                                                                                                                                                             | Required? |
| ------ | ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| name   | String  | Name of the  boat  | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes       |
| type   | String  | Type of the boat   | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes       |
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet.                                                                                                                               | Yes       |

Unlike the PATCH request, all three required attributes must be present.

#### Request Body Example
```json
{
	"name": "Racer2000",
	"type": "Speed boat",
	"length": 100
}
```

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code                | Notes                                                                                               |
| ------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Success | 200 OK                     |
| Failure | 401 Unauthorized           | The bearer token supplied is non-existent or invalid.                                               |
| Failure | 400 Bad Request            | The request object contains attributes other than name, type, and length (e.g. color, manufacturer) |
| Failure | 400 Bad Request            | The name is invalid.                                                                                |
| Failure | 400 Bad Request            | The type is invalid.                                                                                |
| Failure | 400 Bad Request            | The length is invalid.                                                                              |
| Failure | 400 Bad Request            | The request object is missing at least one of the required attributes.                              |
| Failure | 415 Unsupported Media Type | Request body is not in JSON format.                                                                 |
| Failure | 403 Forbidden              | No boat with this boat_id exists, or the boat belongs to another user.                              |
| Failure | 403 Forbidden              | A boat of the same name already exists.                                                             |
| Failure | 406 Not Acceptable         | The requested content type is not available.                                                        |

#### Response Examples
Success - 200 OK
```json
{
    "id": "5072049319968768",
    "name": "Racer2000",
    "type": "Speed boat",
    "length": 100,
    "self": "https://marina-db.appspot.com/boats/5072049319968768"
}
```

Failure - 400 Bad Request
```json
{
    "Error": "The request object is missing at least one of the required attributes"
}
```


## List a User's Boats
`GET /user/:user_id/boats`

Authentication is required.

### Request

#### Request Parameters
| Name    | Type   | Description                         | Required |
| ------- | ------ | ----------------------------------- | -------- |
| user_id | Number | The ID of the user owning the boats | Yes      |

#### Request Body
None

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                                                                |
| ------- | ------------------ | ------------------------------------------------------------------------------------ |
| Success | 200 OK             |
| Failure | 401 Unauthorized   | The bearer token supplied is non-existent or invalid.                                |
| Failure | 401 Unauthorized   | The bearer token does not contain the user_id matching the user_id in the parameter. |
| Failure | 406 Not Acceptable | The requested content type is not available.                                         |

## Delete a Boat
`DELETE /boats/:boat_id`

Authentication is required.

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |

#### Request Body
None

### Response

#### Response Statuses
| Outcome | Status Code      | Notes                                                                  |
| ------- | ---------------- | ---------------------------------------------------------------------- |
| Success | 204 No Content   |
| Failure | 401 Unauthorized | The bearer token supplied is non-existent or invalid.                  |
| Failure | 403 Forbidden    | No boat with this boat_id exists, or the boat belongs to another user. |

#### Response Examples
Failure - 403 Forbidden
```json
{
    "Error": "Cannot delete boat not owned by the user"
}
``` 


## Create a Load
`POST /loads`

### Request

#### Request Body
- Required: yes
- Format(s): application/json

#### Request Body Attributes
| Name     | Type              | Description                      | Constraint | Required? |
| -------- | ----------------- | -------------------------------- | ---------- | --------- |
| weight   | Integer or Double | Weight of the load               | None       | Yes       |
| content  | String            | Content of the load              | None       | Yes       |
| delivery | String            | Date the load is to be delivered | None       | Yes       |

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                                                  |
| ------- | ------------------ | ---------------------------------------------------------------------- |
| Success | 201 Created        |
| Failure | 400 Bad Request    | The request object is missing at least one of the required attributes. |
| Failure | 406 Not Acceptable | The requested content type is not available.                           |

#### Response Examples
Success - 200 OK
```json
{ 
    "id":"123abc",
    "weight": 5,
    "carrier":{},
    "content":"LEGO Blocks",
    "delivery_date": "1/1/2020",
    "self":"https://marina-db2.appspot.com/loads/123abc"
}
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## Get a Load
`GET /loads/:load_id`

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| load_id | String | ID of the load | Yes       |

#### Request Body
None

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                        |
| ------- | ------------------ | -------------------------------------------- |
| Success | 200 OK             |
| Failure | 406 Not Acceptable | The requested content type is not available. |
| Failure | 404 Not Found      | No load with this load_id exists.            |

#### Response Examples
Success - 200 OK
```json
{ 
    "id":"123abc",
    "weight": 5,
    "carrier":{},
    "content":"LEGO Blocks",
    "delivery_date": "1/1/2020",
    "self":"https://appspot.com/loads/123abc"
}
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## List all Loads
`GET /loads`

### Request
#### Request Headers
| Name   | Type   | Description                                      | Required |
| ------ | ------ | ------------------------------------------------ | -------- |
| cursor | String | The cursor indicating the next items in the list | No       |

#### Request Body
None

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                        |
| ------- | ------------------ | -------------------------------------------- |
| Success | 200 OK             |
| Failure | 406 Not Acceptable | The requested content type is not available. |

#### Response Examples
Success - 200 OK
```json
{"items":
    [
        { 
            "id":"123abc",
            "weight": 5,
            "carrier":{},
            "content":"LEGO Blocks",
            "delivery_date": "1/1/2020",
            "self":"https://appspot.com/loads/123abc"
        },
        { 
            "id":"456def",
            "weight": 10.2,
            "carrier":{},
            "content":"Hot Cheetos",
            "delivery_date": "2/3/2020",
            "self":"https://appspot.com/loads/456def"
        }
    ],
    "next": "https://marina-db.appspot.com/boats?cursor=CiYSIGoLbX5tYXJpbmEtZGJyEQsSBEJvYXQYgICAkPCWhgoMGAAgAA==",
    "totalCount": 6
}
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## List all Loads on a Boat
`GET /boat/:boat_id/loads`

### Request
#### Request Parameters
| Name    | Type    | Description                   | Required |
| ------- | ------- | ----------------------------- | -------- |
| boat_id | Integer | The boat ID to get loads from | Yes      |

#### Request Body
None

### Response
- Format(s): application/json

#### Response Statuses
| Outcome | Status Code        | Notes                                        |
| ------- | ------------------ | -------------------------------------------- |
| Success | 200 OK             |
| Failure | 406 Not Acceptable | The requested content type is not available. |

#### Response Examples
Success - 200 OK
```json
[
    { 
        "id":"123abc",
        "weight": 5,
        "carrier":{
            "id":"321cba",
            "name": "fishing boat",
            "self": "https://appspot.com/loads/321cba"
        },
        "content":"LEGO Blocks",
        "delivery_date": "1/1/2020",
        "self":"https://appspot.com/loads/123abc"
    },
    { 
        "id":"456def",
        "weight": 10.2,
        "carrier":{
            "id":"321cba",
            "name": "fishing boat",
            "self": "https://appspot.com/loads/321cba"
        },
        "content":"Hot Cheetos",
        "delivery_date": "2/3/2020",
        "self":"https://appspot.com/loads/456def"
    }
]
```

Failure - 406 Not Acceptable
```json
{
    "Error": "The requested content type is not available"
}
```


## Delete a Load
`DELETE /loads/:load_id`

### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| load_id | String | ID of the load | Yes       |

#### Request Body
None

### Response

#### Response Statuses
| Outcome | Status Code    | Notes                             |
| ------- | -------------- | --------------------------------- |
| Success | 204 No Content |
| Failure | 404 Not Found  | No load with this load_id exists. |

#### Response Examples
Failure - 404 Not Found
```json
{
    "Error": "No load with this load_id exists."
}
```


## Put a Load on a Boat
`PUT /boat/:boat_id/loads/load_id`
### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |
| load_id | String | ID of the load | Yes       |

#### Request Body
None

\* Note: You will need to set Content-Length to 0 in your request when calling out to this endpoint.

### Response

#### Response Statuses
| Outcome | Status Code    | Notes                                                         |
| ------- | -------------- | ------------------------------------------------------------- |
| Success | 204 No Content |
| Success | 403 Forbidden  | The load is already assigned to a boat.                       |
| Failure | 404 Not Found  | No boat with this boat_id carries the load with this load_id. |

#### Response Examples
Failure - 403 Forbidden
```json
{
    "Error": "The load is already assigned to a boat."
}
```


## Remove a Load from a Boat
`DELETE /boat/:boat_id/loads/load_id`
### Request

#### Request Parameters
| Name    | Type   | Description    | Required? |
| ------- | ------ | -------------- | --------- |
| boat_id | String | ID of the boat | Yes       |
| load_id | String | ID of the load | Yes       |

#### Request Body
None

### Response

#### Response Statuses
| Outcome | Status Code    | Notes                                                         |
| ------- | -------------- | ------------------------------------------------------------- |
| Success | 204 No Content |
| Failure | 404 Not Found  | No boat with this boat_id carries the load with this load_id. |

#### Response Examples
Failure - 403 Forbidden
```json
{
    "Error": "The load is already assigned to a boat."
}
```


# Notes on Testing
Upon getting a JWT from the application, copy and paste it into the Authorization tab **of the test suite**, not individual tests. Most tests are set to inherit the suite's authorization, except ones that test for a 401 status code.

A boat entity has been pre-made in the Datastore with the following info:

- Name: Yacht-4000
- Type: Yacht
- Length: 100
- Owner: 123456789
- ID: 5664902681198592

The predetermined owner value is used to test that the entity cannot be viewed among the list of a user's boats, edited, or deleted. It is hardcoded in the Postman test suite as "other_owner_id". The ID is hardcoded as "other_owner_boat_id". At the end of the test run, it should remain as the only boat stored, since it cannot be deleted. An appropriate test checks that there is only one boat left.