# API Spec

## Create a boat
`POST /boats`

### Request

#### Request Parameters
None

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name | Type | Description | Constraint | Required?
|--|--|--|--|--
| name | String | Name of the  boat | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes
| type | String | Type of the boat | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet. | Yes

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
| Outcome | Status Code | Notes 
|--|--|--
| Success | 201 Created |
| Failure | 403 Forbidden | The request object contains attributes other than name, type, and length (e.g. color, manufacturer).
| Failure | 403 Forbidden | The name is invalid.
| Failure | 403 Forbidden | The type is invalid.
| Failure | 403 Forbidden | The length is invalid.
| Failure | 403 Forbidden | A boat of the same name already exists.
| Failure | 415 Unsupported Media Type | Request body is not in JSON format.
| Failure | 400 Bad Request | The request object is missing at least one of the required attributes.

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


## Get a Boat
`GET /boats/:boat_id`

### Request

#### Request Parameters
| Name | Type | Description | Required?
|-|-|-|-
| boat_id | String | ID of the boat | Yes

#### Request Body
None

### Response
- Format(s): application/json, text/html

#### Response Statuses
| Outcome | Status Code | Notes 
|--|--|--
| Success | 200 OK |
| Failure | 406 Not Acceptable | The requested content type is not available.
| Failure | 404 Not Found | No boat with this boat_id exists.

#### Response Examples
Success - 200 OK
```json
{
<span class="string key">"length"</span>: <span class="number">30</span>,
<span class="string key">"name"</span>: <span class="string value">"Fisherman Pro-3000"</span>,
<span class="string key">"type"</span>: <span class="string value">"Fishing boat"</span>,
<span class="string key">"loads"</span>: [

],
<span class="string key">"id"</span>: <span class="string value">"5752995614556160"</span>,
<span class="string key">"self"</span>:
<span class="string value">"https://marina-db.appspot.com/boats/5752995614556160"</span>
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

### Request

#### Request Parameters
| Name | Type | Description | Required?
|-|-|-|-
| boat_id | String | ID of the boat | Yes

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name | Type | Description | Constraint | Required?
|--|--|--|--|--
| name | String | Name of the  boat | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes*
| type | String | Type of the boat | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes*
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet. | Yes*

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
| Outcome | Status Code | Notes 
|--|--|--
| Success | 200 OK |
| Failure | 403 Forbidden | The request object contains attributes other than name, type, and length (e.g. color, manufacturer)
| Failure | 403 Forbidden | The name is invalid.
| Failure | 403 Forbidden | The type is invalid.
| Failure | 403 Forbidden | The length is invalid. 
| Failure | 415 Unsupported Media Type | Request body is not in JSON format
| Failure | 400 Bad Request | The request object is missing a required attribute.
| Failure | 404 Not Found | No boat with this boat_id exists.

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

Similar in functionality to the PATCH request, with a couple of differences:
- The request body must have all three required attributes (name, type, length).
- Success returns the status code **303 See Other** and the URL to the boat in the header's Location attribute.

### Request

#### Request Parameters
| Name | Type | Description | Required?
|-|-|-|-
| boat_id | String | ID of the boat | Yes

#### Request Body
- Required: Yes
- Format(s): application/json

#### Request Attributes
| Name | Type | Description | Constraint | Required?
|--|--|--|--|--
| name | String | Name of the  boat | Name must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes
| type | String | Type of the boat | Type must only contain alphanumeric characters, spaces, and dashes. It must start with an alphanumeric character. Additionally, it must be 20 characters long or less. | Yes
| length | Integer | Length of the boat | Length must be between 10 and 1000 feet. | Yes

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
| Outcome | Status Code | Notes 
|--|--|--
| Success | 200 OK |
| Failure | 403 Forbidden | The request object contains attributes other than name, type, and length (e.g. color, manufacturer)
| Failure | 403 Forbidden | The name is invalid.
| Failure | 403 Forbidden | The type is invalid.
| Failure | 403 Forbidden | The length is invalid. 
| Failure | 415 Unsupported Media Type | Request body is not in JSON format
| Failure | 400 Bad Request | The request object is missing at least one of the required attributes.
| Failure | 404 Not Found | No boat with this boat_id exists.

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


## Delete a Boat
`DELETE /boats/:boat_id`

### Request

#### Request Parameters
| Name | Type | Description | Required?
|-|-|-|-
| boat_id | String | ID of the boat | Yes

#### Request Body
None

### Response

#### Response Statuses
| Outcome | Status Code | Notes 
|--|--|--
| Success | 204 No Content |
| Failure | 404 Not Found | No boat with this boat_id exists.

#### Response Examples
Failure - 404 Not Found
```json
{
    "Error": "No boat with this boat_id exists"
}
``` 