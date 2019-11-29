## URL
http://35.247.48.80:8080

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
| Failure | 400 Bad Request | The request object contains attributes other than name, type, and length (e.g. color, manufacturer).
| Failure | 400 Bad Request | The name is invalid.
| Failure | 400 Bad Request | The type is invalid.
| Failure | 400 Bad Request | The length is invalid.
| Failure | 400 Bad Request | The request object is missing at least one of the required attributes.
| Failure | 403 Forbidden | A boat of the same name already exists.
| Failure | 415 Unsupported Media Type | Request body is not in JSON format.

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