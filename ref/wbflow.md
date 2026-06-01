### Flow Creation Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

Example payload for a Status Change Webhook upon flow creation, where only the new status is provided.

```APIDOC
## POST /webhook

### Description
Receives webhook notifications for flow creation events in WhatsApp Flows.

### Method
POST

### Endpoint
`/webhook`

### Request Body

- **object** (string) - Required - The webhook a business has subscribed to. Example: `whatsapp_business_account`.
- **entry** (array of objects) - Required - An array of entry objects.
  - **id** (string) - Required - The WhatsApp Business Account ID.
  - **changes** (Array of objects) - Required - An array of change objects.
    - **value** (Object) - Required - A value object containing event details.
      - **event** (string) - Required - Type of notification. Example: `FLOW_STATUS_CHANGE`.
      - **message** (string) - Required - Detailed message describing the webhook.
      - **flow_id** (string) - Required - ID of the flow.
      - **new_status** (string) - Required - The default status upon creation. Example: `DRAFT`.
    - **field** (String) - Required - Notification type. Example: `flows`.

### Request Example
```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 has been created with DRAFT status",
              "flow_id": "6627390910605886",
              "new_status": "DRAFT"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

### Response
#### Success Response (200)
- **status** (string) - Indicates successful receipt of the webhook.

#### Response Example
```json
{
  "status": "success"
}
```
```

--------------------------------

### Flow Creation Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks

Example payload for a Status Change Webhook when a flow is created, showing the default 'DRAFT' status.

```APIDOC
## POST /webhook

### Description
Receives webhook notifications for flow creation events in WhatsApp Flows.

### Method
POST

### Endpoint
/webhook

### Request Body
- **object** (string) - Required - The webhook a business has subscribed to.
- **entry** (array of objects) - Required - An array of entry objects.
  - **id** (string) - Required - The WhatsApp Business Account ID.
  - **changes** (Array of objects) - Required - An array of change objects.
    - **value** (Object) - Required - Contains details for the change.
      - **event** (string) - Required - Type of notification, must be `FLOW_STATUS_CHANGE`.
      - **message** (string) - Optional - Detailed message describing the webhook.
      - **flow_id** (string) - Required - ID of the flow.
      - **new_status** (string) - Required - The new status of the flow, which will be `DRAFT` for creation events.
    - **field** (String) - Required - Notification type, must be `flows`.

### Request Example
```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 has been created with DRAFT status",
              "flow_id": "6627390910605886",
              "new_status": "DRAFT"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

### Response
#### Success Response (200)
- **status** (string) - Indicates success.

#### Response Example
```json
{
  "status": "success"
}
```
```

--------------------------------

### Interactive Flow Preview URL

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Example of a configured preview URL with interactive mode, debug panel, and initial screen data.

```text
https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6...&interactive=true&flow_action=navigate&flow_action_payload=%7B%22screen%22%3A%22FIRST_SCREEN%22%2C%22data%22%3A%7B%22screen_heading%22%3A%22hello%20world%22%7D%7D&debug=true
```

--------------------------------

### PhotoPicker Flow JSON Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

A sample Flow JSON configuration demonstrating the implementation of a PhotoPicker component within a form.

```json
{
"version": "7.3",
"data_api_version": "3.0",
"routing_model": {
"FIRST": []
},
"screens": [
{
"id": "FIRST",
"title": "Photo Picker Example",
"terminal": true,
"data": {},
"layout": {
"type": "SingleColumnLayout",
"children": [
{
"type": "Form",
"name": "flow_path",
"children": [
{
"type": "PhotoPicker",
"name": "photo_picker",
"label": "Upload photos",
"description": "Please attach images about the received items",
"photo-source": "camera_gallery",
"min-uploaded-photos": 1,
"max-uploaded-photos": 10,
"max-file-size-kb": 10240
},
{
"type": "Footer",
"label": "Submit",
"on-click-action": {
"name": "data_exchange",
"payload": {
"images": "${form.photo_picker}"
}
}
}
]
}
]
}
}
]
}
```

--------------------------------

### PhotoPicker media payload example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

This is an example payload structure for media uploaded via the PhotoPicker component, including encryption metadata.

```json
"photo_picker":[{
     "media_id": "790aba14-5f4a-4dbd-aa9e-0d75401da14b",
     "cdn_url": "https://mmg.whatsapp.net/v/redacted",
     "file_name": "IMG_5237.jpg"
     "encryption_metadata": {
       "encrypted_hash": "/QvkBvpBED2q2AHPIFuhXfLpkn22zj2kO6ggzjvhHv0=",
       "iv": "5SHjLrrsfPXTSJTcbrVSkg==",
       "encryption_key": "lPa4SXcWbk3sy2so3OxjyXmpV4aE6CcIKd+4byr5hBw=",
       "hmac_key": "15l+E9Z5gcL15WH9OQ8GgK7VVCKkfbVigoSiM9djvGU=",
       "plaintext_hash": "AOF2dHXVEpm9efk9udNy3R1cUJWnpjFwQKGBEdALqXI="
     }]
```

--------------------------------

### Status Change Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

Example of a webhook notification sent when a flow status changes.

```APIDOC
### Request Example
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 changed status from DRAFT to PUBLISHED",
              "flow_id": "6627390910605886",
              "old_status": "DRAFT",
              "new_status": "PUBLISHED"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### Flow Preview Example

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

This is a visual representation of how a Flow screen might appear to a user within WhatsApp. It shows the title, options, and a continue button.

```text
# 
What would you like to buy now
  * # 
Mobile phones
  * # 
eBook readers
  * # 
Cameras

# 
Continue
# 
Managed by the business. Learn more Learn more
```

--------------------------------

### DocumentPicker Flow JSON Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

A complete screen definition using the DocumentPicker component to collect a signed contract.

```json
{
"version": "7.3",
"data_api_version": "3.0",
"routing_model": {
"SECOND": []
},
"screens": [
{
"id": "SECOND",
"terminal": true,
"title": "Document Picker Example",
"data": {},
"layout": {
"type": "SingleColumnLayout",
"children": [
{
"type": "Form",
"name": "flow_path",
"children": [
{
"type": "DocumentPicker",
"name": "document_picker",
"label": "Contract",
"description": "Attach the signed copy of the contract",
"min-uploaded-documents": 1,
"max-uploaded-documents": 1,
"max-file-size-kb": 1024,
"allowed-mime-types": [
"image/jpeg",
"application/pdf"
]
},
{
"type": "Footer",
"label": "Submit",
"on-click-action": {
"name": "complete",
"payload": {
"documents": "${form.document_picker}"
}
}
}
```

--------------------------------

### Flow Creation Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Example response returned after attempting to create a flow, including potential validation errors.

```json
{
   "id": "<Flow-ID>"
   "success": true,
   "validation_errors": [
    {
      "error": "INVALID_PROPERTY_VALUE" ,
      "error_type": "FLOW_JSON_ERROR",
      "message": "Invalid value found for property 'type'.",
      "line_start": 10,
      "line_end": 10,
      "column_start": 21,
      "column_end": 34,
      "pointers": [
       {
         "line_start": 10,
         "line_end": 10,
         "column_start": 21,
         "column_end": 34,
         "path": "screens [0]. layout.children [0].type"
       }
      ]
    }
  ]
}
```

--------------------------------

### Response Message Media Handling (Cloud API)

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Describes how media is received in response messages via webhooks, using PhotoPicker as an example.

```APIDOC
## Response Message (Cloud API)

### Description
Media can be received in the response message webhook. The structure is similar for PhotoPicker and DocumentPicker.

### Response Example (Truncated)
```json
{
  "nfm_reply": {
    "response_json": {
      "photo_picker": [
        {
          "file_name": "IMG_5237.jpg",
          "mime_type": "image/jpeg",
          "sha256": "PqHgadp8cJ/N6mvAYGNMxhs9Ra5hbZFcctCtCClXsMU=",
          "id": "3631120727156756"
        }
      ],
      "flow_token": "xyz",
      "name": "John"
    }
  }
}
```

### Downloading Media
The media can be downloaded following the same steps as for regular image and document messages (refer to the 'Handling Media' section).
```

--------------------------------

### Endpoint Availability Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This webhook is triggered when the flow endpoint's availability breaches a set threshold. It indicates that users may be unable to use the flow.

```json
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "ENDPOINT_AVAILABILITY",
            "message": "The flow endpoint availability has breached the 90% threshold in the last 10 minutes. Users will be unable to open or use the flow.",
            "flow_id": "12345678",
            "alert_state": "ACTIVATED",
            "availability": 75,
            "threshold": 90
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### Flow JSON Update Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Example response returned after attempting to update Flow JSON, including potential validation errors.

```json
{
  "success": true,
  "validation_errors": [
    {
      "error": "INVALID_PROPERTY_VALUE" ,
      "error_type": "FLOW_JSON_ERROR",
      "message": "Invalid value found for property 'type'.",
      "line_start": 10,
      "line_end": 10,
      "column_start": 21,
      "column_end": 34,
      "pointers": [
       {
         "line_start": 10,
         "line_end": 10,
         "column_start": 21,
         "column_end": 34,
         "path": "screens [0]. layout.children [0].type"
       }
      ]
    }
  ]
}
```

--------------------------------

### GET /{FLOW-ID}/assets

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Retrieves all assets attached to a specified Flow.

```APIDOC
## GET /{FLOW-ID}/assets

### Description
Returns all assets attached to a specified Flow.

### Method
GET

### Endpoint
{BASE-URL}/{FLOW-ID}/assets

### Response
#### Success Response (200)
- **data** (array) - List of assets
- **paging** (object) - Paging information

#### Response Example
{
  "data": [
    {
      "name": "flow.json",
      "asset_type": "FLOW_JSON",
      "download_url": "https://scontent.xx.fbcdn.net/m1/v/t0.57323-24/An_Hq0jnfJ..."
    }
  ],
  "paging": {
    "cursors": {
      "before": "QVFIU...",
      "after": "QVFIU..."
    }
  }
}
```

--------------------------------

### Flow Version Expiry Warning Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This webhook alerts you when a flow version is about to freeze or expire, preventing you from publishing or sending the flow. It advises migrating to a recommended version.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_VERSION_EXPIRY_WARNING",
              "warning": "Your current Flow version will freeze in 21 days. You won't be able to send the Flow after it expires. Please migrate to the recommended version as soon as possible. https://developers.facebook.com/docs/whatsapp/flows/changelogs#currently-supported-versions",
              "flow_id": "6627390910605886"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### GET /{WABA-ID}/flows

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Retrieves a list of all Flows associated with the specified WhatsApp Business Account.

```APIDOC
## GET /{WABA-ID}/flows

### Description
Retrieves a list of Flows under a WhatsApp Business Account (WABA).

### Method
GET

### Endpoint
/{WABA-ID}/flows

### Parameters
#### Path Parameters
- **WABA-ID** (string) - Required - The ID of the WhatsApp Business Account.

### Request Example
curl '{BASE-URL}/{WABA-ID}/flows' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'

### Response
#### Success Response (200)
- **data** (array) - A list of Flow objects.
- **paging** (object) - Paging information including cursors.

#### Response Example
{
    "data": [
    {
        "id": "flow-1",
        "name": "flow 1",
        "status": "DRAFT",
        "categories": [ "CONTACT_US" ],
        "validation_errors": []
    },
    {
        "id": "flow-2",
        "name": "flow 2",
        "status": "PUBLISHED",
        "categories": [ "SURVEY" ],
        "validation_errors": []
    },
    {
        "id": "flow-3",
        "name": "flow 3",
        "status": "DRAFT",
        "categories": [ "LEAD_GENERATION" ],
        "validation_errors": []
    }
    ],
    "paging": {
        "cursors": {
            "before": "QVFI...",
            "after": "QVFI..."
        }
    }
}
```

--------------------------------

### Response message media structure (Cloud API)

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Example of media information received in a response message webhook, including file name, MIME type, SHA256 hash, and ID.

```json
{
    "nfm_reply": {
        // [... redacted ... ]
        "response_json": {
            "photo_picker": [
                {
                    "file_name": "IMG_5237.jpg",
                    "mime_type": "image/jpeg",
                    "sha256": "PqHgadp8cJ/N6mvAYGNMxhs9Ra5hbZFcctCtCClXsMU=",
                    "id": "3631120727156756"
                }
            ],
            "flow_token": "xyz",
            "name": "John"
        }
    }
}
```

--------------------------------

### GET /{Flow-ID}

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

Retrieves metric data points for a specified flow over a defined time period and granularity.

```APIDOC
## GET /{Flow-ID}

### Description
Allows you to retrieve particular metric data points for a specified time period and granularity.

### Method
GET

### Endpoint
/{Flow-ID}

### Parameters
#### Query Parameters
- **name** (string) - Required - Metric name.
- **granularity** (string) - Required - Time granularity (DAY, HOUR, or LIFETIME).
- **since** (string: YYYY-MM-DD) - Optional - Start of the time period.
- **until** (string: YYYY-MM-DD) - Optional - End of the time period.

### Request Example
curl '{Base-URL}/{Flow-ID}?fields=metric.name(ENDPOINT_REQUEST_ERROR).granularity(day).since(2024-01-28).until(2024-01-30)' --header 'Authorization: Bearer {ACCESS-TOKEN}'

### Response
#### Success Response (200)
- **id** (string) - The unique ID of the flow.
- **metric** (object) - Metric response object.
- **metric.granularity** (string) - Requested time granularity.
- **metric.name** (string) - Requested metric name.
- **metric.data_points** (array) - A list of metric data points.
- **metric.data_points.timestamp** (string) - Timestamp of the beginning of the data point interval.
- **metric.data_points.data** (array) - Metric specific data object.

#### Response Example
{
  "id": "<Flow-ID>",
  "metric": {
    "granularity": "DAY",
    "name": "ENDPOINT_REQUEST_ERROR",
    "data_points": [
      {
        "timestamp": "2024-01-28T08:00:00+0000",
        "data": [
          { "key": "timeout_error", "value": 5 }
        ]
      }
    ]
  }
}
```

--------------------------------

### Flow Status Change Webhook Example

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This notification is sent when a flow's status changes, such as being created with a DRAFT status. It may include warnings about version freezing.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 has been created with DRAFT status",
              "flow_id": "6627390910605886",
              "new_status": "DRAFT",
              "warning": "Your current Flow version will freeze in 21 days. You won't be able to send the Flow after it expires. Please migrate to the recommended version as soon as possible. https://developers.facebook.com/docs/whatsapp/flows/changelogs#currently-supported-versions"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### Example: Flow Endpoint Latency Distribution

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This JSON structure shows the distribution of endpoint request latencies in seconds, grouped into categories. It is used for the ENDPOINT_REQUEST_LATENCY_SECONDS_CEIL metric, with '10+' representing latencies of 10 seconds or more.

```json
[
  {
    "key": "1",
    "value": 410
  },
  {
    "key": "3",
    "value": 61
  },
  {
    "key": "10",
    "value": 2
  },
  {
    "key": "10+",
    "value": 33
  }
]
```

--------------------------------

### Example: Flow Endpoint Availability Check Results

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This JSON structure indicates the results of periodical availability checks for a flow's endpoint. It is used for the ENDPOINT_AVAILABILITY metric, with 'succeeded' and 'failed' counts.

```json
[
  {
    "key": "succeeded",
    "value": 10
  },
  {
    "key": "failed",
    "value": 5
  }
]
```

--------------------------------

### GET /websites/developers_facebook_whatsapp_flows/{FLOW-ID}

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Retrieves the details of a single WhatsApp Flow. By default, it returns 'id', 'name', 'status', 'categories', and 'validation_errors'. Additional fields can be requested using the 'fields' query parameter. The 'health_status.phone_number(PHONE_NUMBER_ID)' parameter can be used to check the flow's compatibility with a specific phone number.

```APIDOC
## GET /websites/developers_facebook_whatsapp_flows/{FLOW-ID}

### Description
Retrieves a single Flow's details. By default, it returns `id`, `name`, `status`, `categories`, `validation_errors`. You can request other fields by using the `fields` param in the request.

### Method
GET

### Endpoint
`/{BASE-URL}/{FLOW-ID}`

### Query Parameters
- **fields** (string) - Optional - A comma-separated list of fields to retrieve. Possible values include: `id`, `name`, `categories`, `preview`, `status`, `validation_errors`, `json_version`, `data_api_version`, `endpoint_uri`, `whatsapp_business_account`, `application`, `health_status`.
- **health_status.phone_number** (string) - Optional - The phone number ID to check the health status against.

### Request Example
```bash
curl '{BASE-URL}/{FLOW-ID}?fields=id,name,categories,preview,status,validation_errors,json_version,data_api_version,endpoint_uri,whatsapp_business_account,application,health_status' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

### Response
#### Success Response (200)
- **id** (string) - The unique ID of the Flow.
- **name** (string) - The user-defined name of the Flow.
- **status** (string) - The current status of the Flow (e.g., `DRAFT`, `PUBLISHED`, `DEPRECATED`, `BLOCKED`, `THROTTLED`).
- **categories** (array) - A list of flow categories.
- **validation_errors** (array) - A list of errors in the Flow that must be fixed before publishing.
- **json_version** (string) - The version specified by the developer in the Flow JSON asset.
- **data_api_version** (string) - The version of the Data API specified by the developer.
- **endpoint_uri** (string) - The URL of the WA Flow Endpoint.
- **preview** (object) - Contains `preview_url` and `expires_at` for the flow preview.
- **whatsapp_business_account** (object) - The WhatsApp Business Account that owns the Flow.
- **application** (object) - The Facebook developer application used to create the Flow.
- **health_status** (object) - Information about the health of the flow and its associated entities.

#### Response Example
```json
{
  "id": "<Flow-ID>",
  "name": "<Flow-Name>",
  "status": "DRAFT",
  "categories": [ "LEAD_GENERATION" ],
  "validation_errors": [],
  "json_version": "3.0",
  "data_api_version": "3.0",
  "endpoint_uri": "https://example.com",
  "preview": {
    "preview_url": "https://business.facebook.com/wa/manage/flows/55000..../preview/?token=b9d6.....",
    "expires_at": "2023-05-21T11:18:09+0000"
  },
  "whatsapp_business_account": {
    ...
  },
  "application": {
    ...
  },
  "health_status": {
    "can_send_message": "BLOCKED",
    "entities": [
      {
        "entity_type": "FLOW",
        "id": "<Flow-ID>",
        "can_send_message": "BLOCKED",
        "errors": [
          {
            "error_code": 131000,
            "error_description": "endpoint_uri: You need to set the endpoint URI before you can send or publish a flow.",
            "possible_solution": "https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#top-level-flow-json-properties"
          },
          {
            "error_code": 131000,
            "error_description": "app_check: You need to connect a Meta app to the flow before you can send or publish it.",
            "possible_solution": "https://developers.facebook.com/docs/development/create-an-app"
          }
        ]
      },
      {
        "entity_type": "WABA",
        "id": "<WABA-ID>",
        "can_send_message": "AVAILABLE"
      },
      {
        "entity_type": "BUSINESS",
        "id": "<Business-ID>",
        "can_send_message": "AVAILABLE"
      },
      {
        "entity_type": "APP",
        "id": "<App-ID>",
        "can_send_message": "LIMITED",
        "additional_info": [
          "Your app is not subscribed to the message webhook. This means you will not receive any messages sent to your phone number."
        ]
      }
    ]
  }
}
```
```

--------------------------------

### Example: Flow Endpoint Request Count

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This JSON structure represents the count of requests sent to a flow's endpoint within a given period. It is used for the ENDPOINT_REQUEST_COUNT metric.

```json
[
  {
    "key": "value",
    "value": 315
  }
]
```

--------------------------------

### Example: Flow Endpoint Request Error Rate

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This JSON structure represents the ratio of endpoint request errors to the total number of requests for a flow. It is used for the ENDPOINT_REQUEST_ERROR_RATE metric.

```json
[
  {
    "key": "value",
    "value": 0.24
  }
]
```

--------------------------------

### Example: Flow Endpoint Errors by Type

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This JSON structure details the types and counts of errors encountered for a flow's endpoint. It is used for the ENDPOINT_REQUEST_ERROR metric and includes categories like timeout_error and unexpected_http_status_code.

```json
[
  {
    "key": "timeout_error",
    "value": 5
  },
  {
    "key": "unexpected_http_status_code",
    "value": 10
  }
]
```

--------------------------------

### Handle Initial Flow Request (INIT)

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Returns the initial offer data and sets up the PRODUCT_SELECTOR screen when a user clicks a Flow's call to action button. This action initiates the flow.

```javascript
// handle initial request when opening the flow and display PRODUCT_SELECTOR screen
if (action === "INIT") {
  return {
    ...SCREEN_RESPONSES.PRODUCT_SELECTOR
  };
}
```

--------------------------------

### Handle INIT Action

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

Responds to the initial Flow CTA by returning the data for the APPLICANTS screen.

```javascript
 // handle initial request when opening the flow and display APPLICANTS screen
  if (action === "INIT") {
    return {
      ...SCREEN_RESPONSES.APPLICANTS,
      data: {
        ...SCREEN_RESPONSES.APPLICANTS.data,
        additional_applicants_count: undefined,
      },
    };
  }
```

--------------------------------

### Handle INIT Request for Loan Screen

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Returns the initial loan data and pre-sets dropdowns when the Flow is first opened with an 'INIT' action.

```javascript
// handle initial request when opening the flow and display LOAN screen
if (action === "INIT") {
  return {
    ...SCREEN_RESPONSES.LOAN,
  };
}
```

--------------------------------

### Handle final navigation to POLICY_SELECTION

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

Use this logic to finalize data collection and navigate to the policy selection screen.

```javascript
return {
  ...SCREEN_RESPONSES.POLICY_SELECTION,
  data: {
    // copy initial screen data then override specific fields
    ...SCREEN_RESPONSES.POLICY_SELECTION.data,
    ...rest,
    additional_applicants: updateApplicantsList,
    additional_applicants_count: undefined, // we do not need to send the count to the next screen
    additional_applicant_index: undefined, // we do not need to send the index to the next screen     },
};
```

--------------------------------

### Handle OPTIONS Screen Response

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Processes user preferences from the 'OPTIONS' screen to return a personalized offer. It sets the offer label and carries over the selected product.

```javascript
case "OPTIONS":
  // TODO here process user selected preferences and return customised offer
  return {
    ...SCREEN_RESPONSES.OFFER,
    data: {
      // copy initial screen data then override specific fields
      ...SCREEN_RESPONSES.OFFER.data,
      offer_label: "Here are 4 shortlisted " + data.selected_product + "s",
      selected_product: data.selected_product,
    },
  };
```

--------------------------------

### Handle OFFER Screen Response

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Retrieves details of the user's selected device from the 'OFFER' screen response. It filters the available devices to find the selected one and sets the product name and selected device.

```javascript
case "OFFER":
  // TODO return details of selected device
  return {
    ...SCREEN_RESPONSES.PRODUCT_DETAIL,
    data: {
      // copy initial screen data then override specific fields
      ...SCREEN_RESPONSES.PRODUCT_DETAIL.data,
      product_name: SCREEN_RESPONSES.OFFER.data.shortlisted_devices
          .filter((a) => a.id === data.device)
          .map((a) => a.title)[0],
      selected_device: data.device,
    },
  };
```

--------------------------------

### Generate Flow Preview URL

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Generates a public URL to visualize and interact with a Flow. The preview link expires in 30 days.

```bash
curl '{BASE-URL}/{FLOW-ID}?fields=preview.invalidate(false)' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

--------------------------------

### Handle PRODUCT_SELECTOR Screen Response

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Parses the selected product type from the 'PRODUCT_SELECTOR' screen and dynamically sets variables for the 'OPTIONS' screen, including the CTA label and screen heading. It also determines if phone-related questions should be displayed.

```javascript
case "PRODUCT_SELECTOR":
  const product_type = data.product_selection.split('_').pop().slice(0, -1);
  return {
    ...SCREEN_RESPONSES.OPTIONS,
    data: {
      // copy initial screen data then override specific fields
      ...SCREEN_RESPONSES.OPTIONS.data,
      phone_use_case: data.product_selection === SCREEN_RESPONSES.PRODUCT_SELECTOR.data.products[0].id,
      cta_label: "View " + product_type + "s",
      screen_heading: "Let's find the perfect " + product_type + " offer for you",
      selected_product: product_type,
    },
  };
```

--------------------------------

### Handle Loan Screen Data Exchange

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Manages user selections for loan amount and tenure. If 'emi' is null, it calculates and returns a new EMI. If 'emi' is specified, it proceeds to the 'DETAILS' screen with selected loan parameters.

```javascript
// Handles user selecting UPI or Banking selector
if (data.payment_mode != null) {
  return {
    ...SCREEN_RESPONSES.DETAILS,
    data: {
      is_upi: data.payment_mode == "UPI",
      is_account: data.payment_mode == "Bank",
    },
  };
}
```

--------------------------------

### Handling Media Uploads

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Information on how to handle uploaded media, including security considerations and differences between Cloud API and On-Premise API.

```APIDOC
## Handling Media Uploads

### Security Considerations
WhatsApp does not guarantee that media files (images, videos, documents) shared by customers are non-malicious. Implement appropriate risk mitigations when processing such data, for example, by using well-tested and up-to-date media and document processing libraries.

### API Client Support
- **Cloud API**: Supports media upload components.
- **On-Premise API**: Does not support media upload components. Refer to the deprecation announcement for migration guidance to Cloud API.
```

--------------------------------

### Handle Summary Screen Data Exchange

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Constructs the 'SUMMARY' screen data by copying default values and overriding them with the selected amount, tenure, and EMI. It also formats the payment mode for display.

```javascript
    
return {
  ...SCREEN_RESPONSES.SUMMARY,
  data: {
    // copy initial screen data then override specific fields
    ...SCREEN_RESPONSES.SUMMARY.data,
    amount: data.amount,
    tenure: data.tenure,
    emi: data.emi,
    payment_mode: "Transfer to " + payment_string,
  },
};
```

--------------------------------

### Configure Express Environment Variables

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Load necessary environment variables for the Express application.

```javascript
const { APP_SECRET, PRIVATE_KEY, PASSPHRASE, PORT = "3000" } = process.env;
```

--------------------------------

### Handling Media from WhatsApp CDN

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Details on how to download, decrypt, and validate media files stored in WhatsApp CDN.

```APIDOC
## Handling Media

### Endpoint
Media uploaded by users are temporarily stored (up to 20 days) in WhatsApp CDN and encrypted using AES256-CBC+HMAC-SHA256+pkcs7.

### Implementation Steps
In your endpoint implementation, you must download, decrypt, and validate each media file.

### Decrypting and Validating Media
Files in WhatsApp CDN contain encrypted media and the first 10 bytes of HMAC-SHA256 (`cdn_file = ciphertext & hmac10`).

1.  **Download cdn_file** from `cdn_url`.
2.  **Verify Hash**: Ensure SHA256(`cdn_file`) == `encryption_metadata.encrypted_hash`.
3.  **Validate HMAC-SHA256**:
    *   Calculate HMAC using `encryption_metadata.hmac_key`, `encryption_metadata.iv`, and the ciphertext.
    *   Verify that the first 10 bytes of the calculated HMAC match `hmac10` (extracted from `cdn_file`).
4.  **Decrypt Media Content**:
    *   Perform AES decryption with CBC mode using `encryption_metadata.iv` on the ciphertext.
    *   Remove PKCS7 padding (AES256 uses 16-byte blocks). Let this be `decrypted_media`.
5.  **Validate Decrypted Media**:
    *   Ensure SHA256(`decrypted_media`) == `encryption_metadata.plaintext_hash`.

### Request Example (Photo/Document Payload)
```json
{
  "photo_picker":[
    {
      "media_id": "790aba14-5f4a-4dbd-aa9e-0d75401da14b",
      "cdn_url": "https://mmg.whatsapp.net/v/redacted",
      "file_name": "IMG_5237.jpg",
      "encryption_metadata": {
        "encrypted_hash": "/QvkBvpBED2q2AHPIFuhXfLpkn22zj2kO6ggzjvhHv0=",
        "iv": "5SHjLrrsfPXTSJTcbrVSkg==",
        "encryption_key": "lPa4SXcWbk3sy2so3OxjyXmpV4aE6CcIKd+4byr5hBw=",
        "hmac_key": "15l+E9Z5gcL15WH9OQ8GgK7VVCKkfbVigoSiM9djvGU=",
        "plaintext_hash": "AOF2dHXVEpm9efk9udNy3R1cUJWnpjFwQKGBEdALqXI="
      }
    }
  ]
}
```
```

--------------------------------

### Web Preview API

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Generates a web preview URL for visualizing and interacting with Flows. The preview URL is public and can be shared.

```APIDOC
## GET /websites/developers_facebook_whatsapp_flows/{FLOW-ID}

### Description
Generates a web preview URL for visualizing and interacting with Flows. The preview URL is public and can be shared with different stakeholders. It can also be interacted with by adding URL parameters.

### Method
GET

### Endpoint
`{BASE-URL}/{FLOW-ID}`

### Query Parameters
- **fields** (string) - Optional - Specifies the fields to retrieve. Example: `preview.invalidate(false)`

### Request Example
```curl
curl '{BASE-URL}/{FLOW-ID}?fields=preview.invalidate(false)' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

### Response
#### Success Response (200)
- **preview** (object) - Contains preview information.
  - **preview_url** (string) - Link for the preview page. This link does not require login and can be shared with stakeholders, but the link will expire in 30 days, or if the API is called with `invalidate=true` which will generate a new link.
  - **expires_at** (string) - Time when the link will expire.
- **id** (string) - The ID of the flow.

#### Response Example
```json
{
  "preview": {
    "preview_url": "https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6....",
    "expires_at": "2023-05-21T11:18:09+0000"
  },
  "id": "flow-1"
}
```

### Web Preview URL Parameters
These parameters can be added to the generated URL to configure the interactive Web Preview:

#### URL Parameters
- **interactive** (boolean) - If `true`, the preview will run in interactive mode. Defaults to `false`.
- **flow_token** (string) - Sent as part of each request. Should always be verified on your server to block unexpected requests. Required for Flows with endpoint.
- **flow_action** (string) - First action when Flow starts. `data_exchange` if it will make a request to the endpoint, or `navigate` if it won't (this will also require `flow_action_payload` to be provided).
- **flow_action_payload** (string) - Initial screen data in JSON format, escaped using `encodeURIComponent`. Required if `flow_action` is `navigate`. Should be omitted otherwise.
- **phone_number** (string) - Phone number that will be used to send the Flow. Required for Flows with endpoint.
- **debug** (string) - Show actions in a separate panel while interacting with the preview. Ignored if `interactive` is not `true`.

#### Sample URL
```
https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6...&interactive=true&flow_action=navigate&flow_action_payload=%7B%22screen%22%3A%22FIRST_SCREEN%22%2C%22data%22%3A%7B%22screen_heading%22%3A%22hello%20world%22%7D%7D&debug=true
```

### Iframe Embedding
The `preview_url` can also be embedded as an iframe into an existing website:

```html
<iframe src="https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6...." width="430" height="800" ></iframe>
```
```

--------------------------------

### Check for Private Key in Node.js

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Validates that the 'PRIVATE_KEY' environment variable is set before proceeding. Throws an error if the private key is missing, indicating a configuration issue.

```javascript
if (!PRIVATE_KEY) {
  throw new Error('Private key is empty. Please check your env variable "PRIVATE_KEY".');
}
```

--------------------------------

### Validate Private Key Presence

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Ensure the private key is configured in the environment variables before processing requests.

```javascript
  
if (!PRIVATE_KEY) {
  throw new Error('Private key is empty. Please check your env variable "PRIVATE_KEY".');
}
    
```

--------------------------------

### Handle iterative applicant data collection

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

Use this logic to loop through additional applicants until all information is collected.

```javascript
if (applicant_index < data.additional_applicants_count) {
  return {
    ...SCREEN_RESPONSES.ADDTIONAL_APPLICANT,
    data: {
      ...rest,
      additional_applicant_title: `Additional Applicant ${
        applicant_index + 1
      }`,
      additional_applicant_index: applicant_index,
      additional_applicants: updateApplicantsList,
   },
 };
}
```

--------------------------------

### Retrieve All Flow Fields with cURL

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Use this cURL command to retrieve all possible fields for a specific Flow. You can customize the `fields` parameter to include only the data you need. Ensure you replace placeholders like `{BASE-URL}`, `{FLOW-ID}`, and `{ACCESS-TOKEN}`.

```bash
curl '{BASE-URL}/{FLOW-ID}?fields=id,name,categories,preview,status,validation_errors,json_version,data_api_version,endpoint_uri,whatsapp_business_account,application,health_status' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

--------------------------------

### Embed Flow Preview in Iframe

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Embeds the generated preview URL into an existing website using an iframe.

```html
<iframe src="https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6...." width="430" height="800" ></iframe>
```

--------------------------------

### Create a New Flow

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Creates a new flow in DRAFT status or publishes it immediately if flow_json and publish parameters are provided.

```curl
curl -X POST '{BASE-URL}/{WABA-ID}/flows' \
--header 'Authorization: Bearer {ACCESS-TOKEN}' \
--header "Content-Type: application/json" \
--data '{
  "name": "My first flow",
  "categories": [ "OTHER" ],
  "flow_json" : "{\"version\":\"5.0\",\"screens\":[{\"id\":\"WELCOME_SCREEN\",\"layout\":{\"type\":\"SingleColumnLayout\",\"children\":[{\"type\":\"TextHeading\",\"text\":\"Hello World\"},{\"type\":\"Footer\",\"label\":\"Complete\",\"on-click-action\":{\"name\":\"complete\",\"payload\":{}}}]},\"title\":\"Welcome\",\"terminal\":true,\"success\":true,\"data\":{}}]}",
  "publish" : true
}'
```

--------------------------------

### Generate Encryption Key Pair

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Run this command in the Glitch terminal to generate a public-private key pair for message decryption. Replace YOUR_PASSPHRASE with a secure passphrase.

```bash
node src/keyGenerator.js YOUR_PASSPHRASE
```

--------------------------------

### POST /{WABA-ID}/flows

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Creates a new Flow in the specified WhatsApp Business Account.

```APIDOC
## POST /{WABA-ID}/flows

### Description
Creates a new Flow. By default, new Flows are created in DRAFT status. You can optionally publish the Flow in the same request by providing the flow_json and setting publish to true.

### Method
POST

### Endpoint
{BASE-URL}/{WABA-ID}/flows

### Parameters
#### Request Body
- **name** (string) - Required - Flow name
- **categories** (array) - Required - A list of Flow categories (e.g., SIGN_UP, SIGN_IN, APPOINTMENT_BOOKING, LEAD_GENERATION, CONTACT_US, CUSTOMER_SUPPORT, SURVEY, OTHER)
- **flow_json** (string) - Optional - Flow's JSON encoded as string
- **publish** (boolean) - Optional - Indicates whether Flow should also get published
- **clone_flow_id** (string) - Optional - ID of source Flow to clone
- **endpoint_uri** (string) - Optional - The URL of the WA Flow Endpoint

### Request Example
{
  "name": "My first flow",
  "categories": [ "OTHER" ],
  "flow_json" : "{\"version\":\"5.0\",\"screens\":[...]}",
  "publish" : true
}

### Response
#### Success Response (200)
- **id** (string) - The ID of the created Flow
- **success** (boolean) - Indicates if the operation was successful
- **validation_errors** (array) - List of validation errors if any

#### Response Example
{
   "id": "<Flow-ID>",
   "success": true
}
```

--------------------------------

### Flow Preview Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

The response containing the generated preview URL and its expiration timestamp.

```json
{
  "preview": {
    "preview_url": "https://business.facebook.com/wa/manage/flows/550.../preview/?token=b9d6....",
    "expires_at": "2023-05-21T11:18:09+0000"
  },
  "id": "flow-1"
}
```

--------------------------------

### Migrate Flows

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Copies Flows from a source WABA to a destination WABA. Migration creates new Flow IDs for the destination.

```curl
curl -X POST '{BASE-URL}/<DESTINATION_WABA_ID>/migrate_flows?source_waba_id=<SOURCE_WABA_ID>
&source_flow_names=<SOURCE_FLOW_NAMES>' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

```json
{
  "migrated_flows": [
    {
      "source_name": "appointment-booking",
      "source_id": "1234",
      "migrated_id": "5678"
    }
  ],
  "failed_flows": [
    {
      "source_name": "lead-gen",
      "error_code": "4233041",
      "error_message": "Flows Migration Error: Flow with the same name exists in destination WABA."
    }
  ]
}
```

--------------------------------

### Sample Metric Data Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

This is a sample JSON response when querying for metric data points. It includes the flow ID, metric details such as granularity and name, and a list of data points with timestamps and their corresponding metric values.

```json
{
  "id": "<Flow-ID>"
  "metric": {
    "granularity": "DAY",
    "name": "ENDPOINT_REQUEST_ERROR",
    "data_points": [
      {
        "timestamp": "2024-01-28T08:00:00+0000",
        "data": [
          {
            "key": "timeout_error",
             "value": 5
          }
        ]
      },
      {
        "timestamp": "2024-01-29T08:00:00+0000",
        "data": [
          {
            "key": "unexpected_http_status_code",
            "value": 12
          }
        ]
      }
    ]
  }
}
```

--------------------------------

### Handle conditional screen navigation on YOUR_HEALTH screen

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

Use this logic to navigate to the policy selection screen when the user selects self-only coverage.

```javascript
if (data.cover === "myself") {
  return {
    ...SCREEN_RESPONSES.POLICY_SELECTION,
    data: {
      // copy initial screen data then override specific fields
      ...SCREEN_RESPONSES.POLICY_SELECTION.data,
      ...data,
    },
  };
}
```

--------------------------------

### POST /{DESTINATION_WABA_ID}/migrate_flows

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Migrates Flows from one WhatsApp Business Account to another.

```APIDOC
## POST /{DESTINATION_WABA_ID}/migrate_flows

### Description
Migrate Flows from one WhatsApp Business Account (WABA) to another. Migration creates copies of Flows in the destination WABA.

### Method
POST

### Endpoint
{BASE-URL}/{DESTINATION_WABA_ID}/migrate_flows

### Parameters
#### Path Parameters
- **DESTINATION_WABA_ID** (string) - Required - Destination WhatsApp Business Account ID

#### Query Parameters
- **source_waba_id** (string) - Required - Source WhatsApp Business Account ID
- **source_flow_names** (array) - Optional - List of specific Flow names to migrate

### Response
#### Success Response (200)
- **migrated_flows** (array) - List of successfully migrated flows
- **failed_flows** (array) - List of flows that failed to migrate

#### Response Example
{
  "migrated_flows": [
    {
      "source_name": "appointment-booking",
      "source_id": "1234",
      "migrated_id": "5678"
    }
  ],
  "failed_flows": [
    {
      "source_name": "lead-gen",
      "error_code": "4233041",
      "error_message": "Flows Migration Error: Flow with the same name exists in destination WABA."
    }
  ]
}
```

--------------------------------

### Handle Flow Version Freeze Warning Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This payload notifies developers when a flow is created using a version that is scheduled to freeze, requiring migration to a supported version.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 has been created with DRAFT status",
              "flow_id": "6627390910605886",
              "new_status": "DRAFT"
              "warning": "Your current Flow version will freeze in 21 days. You won't be able to send the Flow after it expires. Please migrate to the recommended version as soon as possible. https://developers.facebook.com/docs/whatsapp/flows/changelogs#currently-supported-versions" 
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### DocumentPicker Component

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

The DocumentPicker component allows users to upload documents from their device's file storage or gallery within a WhatsApp Flow. It supports configurations for file types, size limits, and upload counts.

```APIDOC
## DocumentPicker Component

### Description
Allows users to upload media from files or gallery.

### Parameters
#### Component Parameters
- **type** (string) - Required - Must be 'DocumentPicker'.
- **name** (string) - Required - A unique name for the component.
- **label** (string) - Required - Header text for the component. Max length: 80 characters. Can use dynamic values like "${data.label}" or "${screen.<screen_id>.data.label}".
- **description** (string) - Optional - Body text for the component. Max length: 300 characters. Can use dynamic values like "${data.description}" or "${screen.<screen_id>.data.description}".
- **allowed-file-types** (array of strings) - Optional - Specifies the allowed file extensions. Example: `[".pdf", ".doc", ".docx"]`.
- **max-file-size-kb** (integer) - Optional - Maximum file size in kibibytes. Default: 25600 (25 MiB). Allowed range: [1, 25600].
- **min-uploaded-files** (integer) - Optional - Minimum number of files required. If 0, the component is optional. Default: 0. Allowed range: [0, 10].
- **max-uploaded-files** (integer) - Optional - Maximum number of files that can be uploaded. Default: 10. Allowed range: [1, 10].
- **enabled** (boolean | string) - Optional - Specifies if user interaction is enabled. Dynamic values supported. Default: true.
- **visible** (boolean | string) - Optional - Specifies if the component is visible. Dynamic values supported. Default: true.
- **error-message** (string | object) - Optional - Specifies errors during file processing. Can be a generic string or an object for file-specific errors.

### Notes on Media Limits
- For media files sent via "data_exchange" action: Max 10 files, aggregated size not exceeding 100 MiB.

### Example (Flow JSON)
```json
{
  "version": "7.3",
  "data_api_version": "3.0",
  "routing_model": {
    "FIRST": []
  },
  "screens": [
    {
      "id": "FIRST",
      "title": "Document Picker Example",
      "terminal": true,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "flow_path",
            "children": [
              {
                "type": "DocumentPicker",
                "name": "document_picker",
                "label": "Upload Documents",
                "description": "Please attach relevant documents",
                "allowed-file-types": [".pdf", ".docx"],
                "min-uploaded-files": 1,
                "max-file-size-kb": 5120
              },
              {
                "type": "Footer",
                "label": "Submit",
                "on-click-action": {
                  "name": "data_exchange",
                  "payload": {
                    "documents": "${form.document_picker}"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```
```

--------------------------------

### Query Metric Data Points with cURL

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/metrics

Use this cURL command to retrieve metric data points for a specific flow. Ensure you replace placeholders like {Base-URL}, {Flow-ID}, and {ACCESS-TOKEN} with your actual values. The 'fields' parameter allows you to specify the metric name, granularity, and time range.

```bash
curl '{Base-URL}/{Flow-ID}?fields=metric.name(ENDPOINT_REQUEST_ERROR).granularity(day).since(2024-01-28).until(2024-01-30)' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

--------------------------------

### Load Environment Variables in Node.js

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Loads necessary environment variables for an Express application, including secrets and port configuration. Ensure 'APP_SECRET', 'PRIVATE_KEY', and 'PASSPHRASE' are set in your environment.

```javascript
const { APP_SECRET, PRIVATE_KEY, PORT = "3000" } = process.env;
```

--------------------------------

### Flows Monitoring Webhooks

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

Webhooks for monitoring Flow client error rates, endpoint error rates, and endpoint latency.

```APIDOC
## Webhook: Flows Monitoring

### Description
WhatsApp sends webhooks to notify you when specific performance metrics for your Flows, such as error rates or latency, cross defined thresholds.

### Response Example (Client Error Rate)
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "CLIENT_ERROR_RATE",
            "message": "The flow client request error rate has reached the 5% threshold in the last 60 minutes.",
            "flow_id": "691244242662581",
            "error_rate": 14.28,
            "threshold": 10,
            "alert_state": "ACTIVATED",
            "errors": [
              { "error_type": "INVALID_SCREEN_TRANSITION", "error_rate": 66.66, "error_count": 2 },
              { "error_type": "PUBLIC_KEY_MISSING", "error_rate": 33.33, "error_count": 1 }
            ]
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}

### Response Example (Endpoint Latency)
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "ENDPOINT_LATENCY",
            "message": "Flow endpoint latency has reached the p90 threshold in the last 30 minutes.",
            "flow_id": "691244242662581",
            "p90_latency": 8000,
            "p50_latency": 500,
            "requests_count": 34,
            "threshold": 7000,
            "alert_state": "ACTIVATED"
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### POST /{FLOW-ID}

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the metadata (name, categories, etc.) of an existing Flow.

```APIDOC
## POST /{FLOW-ID}

### Description
Updates the name, categories, endpoint URI, or application ID of an existing Flow.

### Method
POST

### Endpoint
{BASE-URL}/{FLOW-ID}

### Parameters
#### Request Body
- **name** (string) - Optional - Flow name
- **categories** (array) - Optional - A list of Flow categories
- **endpoint_uri** (string) - Optional - The URL of the WA Flow Endpoint
- **application_id** (string) - Optional - The ID of the Meta application connected to the Flow

### Request Example
{
  "name": "New flow name"
}

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the update was successful

#### Response Example
{
  "success": true
}
```

--------------------------------

### Retrieve Flows List Request

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Use this cURL request to fetch all Flows under a specific WhatsApp Business Account. Requires a valid access token.

```curl
curl '{BASE-URL}/{WABA-ID}/flows' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

--------------------------------

### Value Object

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

Details for the change that triggered the webhook, nested within the changes array.

```APIDOC
## Value Object

### Description
Contains details for the change that triggered the webhook.

### Parameters
- **flow_id** (string) - ID of the flow.
- **threshold** (number) - The alert threshold reached or recovered from.
- **event** (string) - Type of webhook notification (FLOW_STATUS_CHANGE, CLIENT_ERROR_RATE, ENDPOINT_ERROR_RATE, ENDPOINT_LATENCY, ENDPOINT_AVAILABILITY).
- **message** (string) - Detailed message describing the webhook.
- **old_status** (string) - Previous status (DRAFT, PUBLISHED, DEPRECATED, BLOCKED, THROTTLED).
- **new_status** (string) - New status (DRAFT, PUBLISHED, DEPRECATED, BLOCKED, THROTTLED).
- **alert_state** (string) - Status of the alert (ACTIVATED, DEACTIVATED).
- **requests_count** (integer) - Number of requests used to calculate metric.
- **errors** (array of objects) - Array of error objects (error_count, error_rate, error_type).
- **p50_latency** (integer) - P50 latency of endpoint requests.
- **p90_latency** (integer) - P90 latency of endpoint requests.
- **error_rate** (integer) - Overall error rate for the alert.
```

--------------------------------

### Flow JSON Template for Collecting Purchase Interest

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/purchase-intent

This JSON defines the structure of a WhatsApp Flow screen for collecting user information like name and email, along with an opt-in for terms and conditions. It uses various UI components such as TextInput and OptIn.

```json
{
"version": "7.3",
"screens": [
{
"id": "JOIN_NOW",
"title": "Join Now",
"data": {},
"layout": {
"type": "SingleColumnLayout",
"children": [
{
"type": "Form",
"name": "form",
"children": [
{
"type": "TextSubheading",
"text": "Get early access to our Mega Sales Day deals. Register now!"
},
{
"type": "TextInput",
"name": "name",
"label": "Name",
"input-type": "text",
"required": true
},
{
"type": "TextInput",
"label": "Email",
"name": "email",
"input-type": "email",
"required": true
},
{
"type": "OptIn",
"label": "I agree to the terms.",
"required": true,
"name": "tos_optin",
"on-click-action": {
"name": "navigate",
"payload": {},
"next": {}
}
}
]
}
}
]
}
}
]
}
```

--------------------------------

### Handle Details Screen Data Exchange

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Updates the 'DETAILS' screen based on user's payment mode selection (UPI or Bank), enabling or disabling fields accordingly.

```javascript
    
// Handles user selecting UPI or Banking selector
if (data.payment_mode != null) {
  return {
    ...SCREEN_RESPONSES.DETAILS,
    data: {
      is_upi: data.payment_mode == "UPI",
      is_account: data.payment_mode == "Bank",
    },
  };
}
```

--------------------------------

### Determine Next Flow Screen

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Process the decrypted body to determine the next screen to display to the user.

```javascript
const screenResponse = await getNextScreen(decryptedBody);
console.log("👉 Response to Encrypt:", screenResponse);
```

--------------------------------

### PhotoPicker Component

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

The PhotoPicker component allows users to upload photos from their device's camera or gallery within a WhatsApp Flow. It supports various configurations for photo source, file size, and upload limits.

```APIDOC
## PhotoPicker Component

### Description
Allows users to upload media from the camera or gallery.

### Parameters
#### Component Parameters
- **type** (string) - Required - Must be 'PhotoPicker'.
- **name** (string) - Required - A unique name for the component.
- **label** (string) - Required - Header text for the component. Max length: 80 characters. Can use dynamic values like "${data.label}" or "${screen.<screen_id>.data.label}".
- **description** (string) - Optional - Body text for the component. Max length: 300 characters. Can use dynamic values like "${data.description}" or "${screen.<screen_id>.data.description}".
- **photo-source** (enum) - Optional - Specifies the source for image selection. Values: 'camera_gallery', 'camera', 'gallery'. Default: 'camera_gallery'.
  - 'camera_gallery': User can select from gallery or take a photo.
  - 'gallery': User can only select from gallery.
  - 'camera': User can only take a photo.
- **max-file-size-kb** (integer) - Optional - Maximum file size in kibibytes. Default: 25600 (25 MiB). Allowed range: [1, 25600].
- **min-uploaded-photos** (integer) - Optional - Minimum number of photos required. If 0, the component is optional. Default: 0. Allowed range: [0, 30].
- **max-uploaded-photos** (integer) - Optional - Maximum number of photos that can be uploaded. Default: 30. Allowed range: [1, 30].
- **enabled** (boolean | string) - Optional - Specifies if user interaction is enabled. Dynamic values supported. Default: true.
- **visible** (boolean | string) - Optional - Specifies if the component is visible. Dynamic values supported. Default: true.
- **error-message** (string | object) - Optional - Specifies errors during image processing. Can be a generic string or an object for media-specific errors.

### Notes on Media Limits
- For media files sent via "data_exchange" action: Max 10 files, aggregated size not exceeding 100 MiB.

### Request Example (Flow JSON)
```json
{
  "version": "7.3",
  "data_api_version": "3.0",
  "routing_model": {
    "FIRST": []
  },
  "screens": [
    {
      "id": "FIRST",
      "title": "Photo Picker Example",
      "terminal": true,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "flow_path",
            "children": [
              {
                "type": "PhotoPicker",
                "name": "photo_picker",
                "label": "Upload photos",
                "description": "Please attach images about the received items",
                "photo-source": "camera_gallery",
                "min-uploaded-photos": 1,
                "max-uploaded-photos": 10,
                "max-file-size-kb": 10240
              },
              {
                "type": "Footer",
                "label": "Submit",
                "on-click-action": {
                  "name": "data_exchange",
                  "payload": {
                    "images": "${form.photo_picker}"
                  }
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```
```

--------------------------------

### Handle conditional screen navigation on DETAILS screen

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

Use this logic to skip the health screen when the user selects child-only coverage.

```javascript
if (data.cover === "my_children") {
  return {
    ...SCREEN_RESPONSES.ADDTIONAL_APPLICANT,
    data: {
      ...data,
      additional_applicants: [],
      additional_applicant_title: "Additional Applicant 1",
      additional_applicant_index: 0,
    },
  };
}
```

--------------------------------

### DocumentPicker Component Definition

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Details the configuration properties for the DocumentPicker component, available from Flow JSON version 4.0.

```APIDOC
## DocumentPicker Component

### Description
The DocumentPicker component enables users to upload files within a Flow. It supports configuration for file size, quantity, and allowed MIME types.

### Parameters
- **type** (string) - Required - Must be "DocumentPicker"
- **name** (string) - Required - Unique identifier for the component
- **label** (string) - Required - Header text for the component
- **description** (string) - Optional - Body text for the component
- **max-file-size-kb** (Integer) - Optional - Max file size in KiB (Default: 25600, Range: 1-25600)
- **min-uploaded-documents** (Integer) - Optional - Minimum files required (Default: 0, Range: 0-30)
- **max-uploaded-documents** (Integer) - Optional - Maximum files allowed (Default: 30, Range: 1-30)
- **allowed-mime-types** (Array<string>) - Optional - List of permitted MIME types
- **enabled** (Boolean/String) - Optional - Interaction state (Default: true)
- **visible** (Boolean/String) - Optional - Visibility state (Default: true)
- **error-message** (String/Object) - Optional - Error feedback configuration

### Request Example
{
  "type": "DocumentPicker",
  "name": "document_picker",
  "label": "Contract",
  "description": "Attach the signed copy of the contract",
  "min-uploaded-documents": 1,
  "max-uploaded-documents": 1,
  "max-file-size-kb": 1024,
  "allowed-mime-types": ["image/jpeg", "application/pdf"]
}
```

--------------------------------

### Handle Health Check Request

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Responds to a 'ping' action with an 'active' status to indicate the endpoint is operational. This is used for health monitoring.

```javascript
// handle health check request
if (action === "ping") {
    return {
        version,
        data: {
            status: "active",
        },
    };
}
```

--------------------------------

### Encrypt Response Message

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Encrypt the screen response using the session keys before sending it back to the user.

```javascript
res.send(encryptResponse(screenResponse, aesKeyBuffer, initialVectorBuffer));
```

--------------------------------

### Webhook Notification Object Structure

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

The general structure of a webhook notification object, containing entries with changes related to WhatsApp Business Account activities.

```APIDOC
## Webhook Notification Object

A combination of nested objects of JSON arrays and objects that contain information about a change.

### Object Properties

- **object** (string) - The webhook a business has subscribed to.
- **entry** (array of objects) - An array of entry objects. Entry objects have the following properties:
  - **id** (string) - The WhatsApp Business Account ID for the business that is subscribed to the webhook.
  - **changes** (Array of objects) - An array of change objects. Change objects have the following properties:
    - **value** (Object) - A value object. See Value Object.
    - **field** (String) - Notification type. Value will be `flows`.
```

--------------------------------

### DocumentPicker Limitations

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Outlines the constraints and validation errors associated with the DocumentPicker component.

```APIDOC
## DocumentPicker Limitations

### Description
Constraints associated with the DocumentPicker component.

### Constraints
- `min-uploaded-documents` should not exceed `max-uploaded-documents`
  - Validation error: "min-uploaded-documents" cannot be greater than "max-uploaded-documents" for DocumentPicker component ${component_name}.
- DocumentPicker cannot be initialized using Form `init-values`
  - Validation error: Invalid value found for property at ${path}. "init-values" property should not contain a value for DocumentPicker component.
- Only 1 DocumentPicker is allowed per screen
  - Validation error: You can only have a maximum of 1 component of type DocumentPicker per screen.
- Using both PhotoPicker and DocumentPicker components on a single screen is not allowed.
  - Validation error: You can only have a maximum of 1 component of type PhotoPicker or DocumentPicker per screen.
- The DocumentPicker is not allowed in the `navigate` action payload.
  - Validation error: The DocumentPicker component's value is not allowed in the payload of the navigate action.
- The DocumentPicker component is restricted to top-level usage within the payloads of the `data_exchange` or `complete` action.
  - Validation error: The DocumentPicker can only be used as the value of a top-level string property in the action payload.
- No more than 10 images or documents can be sent as part of the response message.
  - Additional constraint: The maximum aggregated size of attached images or documents cannot exceed 100 MiB.
```

--------------------------------

### Retrieve Flow Assets

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Fetches a list of assets associated with a specific Flow ID.

```curl
curl '{BASE-URL}/{FLOW-ID}/assets' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

```json
{
  "data": [
    {
      "name": "flow.json",
      "asset_type": "FLOW_JSON",
      "download_url": "https://scontent.xx.fbcdn.net/m1/v/t0.57323-24/An_Hq0jnfJ..."
    }
  ],
  "paging": {
    "cursors": {
      "before": "QVFIU...",
      "after": "QVFIU..."
    }
  }
}
```

--------------------------------

### Handle Endpoint Availability Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This JSON payload represents an alert triggered when the flow endpoint availability drops below the 90% threshold.

```json
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "ENDPOINT_AVAILABILITY",
            "message": "The flow endpoint availability has breached the 90% threshold in the last 10 minutes. Users will be unable to open or use the flow.",
            "flow_id": "12345678",
            "alert_state: "ACTIVATED",
            "availability": 75,
            "threshold" : 90,
          },
          "field": "flows"
        }

      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### Handle Client Error Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Logs client-side errors and returns an acknowledgment. Use this to handle and record errors reported by the client device.

```javascript
// handle error notification
if (data?.error) {
    console.warn("Received client error:", data);
    return {
        version,
        data: {
            acknowledged: true,
        },
    };
}
```

--------------------------------

### Flow Response Message Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This webhook is triggered when a user completes a flow and sends a message back to WhatsApp. It provides details about the user's response within the flow.

```APIDOC
## Flow Response Message Webhook

### Description
When a user completes a flow, a message is sent to the WhatsApp chat. This webhook delivers that message, allowing you to process the user's flow response.

### Method
POST

### Endpoint
Your configured Callback URL

### Request Body
- **messages** (array) - Required - An array containing message objects.
  - **context** (object) - Required - Context of the message the user replied to.
    - **from** (string) - Required - User's WhatsApp account number.
    - **id** (string) - Required - Message ID of the flows request message.
  - **from** (string) - Required - Sender's WhatsApp account number.
  - **id** (string) - Required - Unique ID for the message.
  - **type** (string) - Required - Type of the message, always `interactive` for flow responses.
  - **interactive** (object) - Required - Interactive message object.
    - **type** (string) - Required - Type of interactive message, always `nfm_reply` for flow responses.
    - **nfm_reply** (object) - Required - Non-Facebook message reply object.
      - **name** (string) - Required - Always `flow`.
      - **body** (string) - Required - Always `Sent`.
      - **response_json** (string) - Required - Flow-specific data. This can be defined in the flow JSON or controlled by an endpoint.
  - **timestamp** (string) - Required - Time when the flow response message was sent.

### Request Example
```json
{
  "messages": [
    {
      "context": {
        "from": "16315558151",
        "id": "gBGGEiRVVgBPAgm7FUgc73noXjo"
      },
      "from": "<USER_ACCOUNT_NUMBER>",
      "id": "<MESSAGE_ID>",
      "type": "interactive",
      "interactive": {
        "type": "nfm_reply",
        "nfm_reply": {
          "name": "flow",
          "body": "Sent",
          "response_json": "{\"flow_token\": \"<FLOW_TOKEN>\", \"optional_param1\": \"<value1>\", \"optional_param2\": \"<value2>\"}"
        }
      },
      "timestamp": "<MESSAGE_SEND_TIMESTAMP>"
    }
  ]
}
```

### Response
#### Success Response (200)
This webhook does not typically return a specific success response body to the sender. Acknowledgment is usually handled via HTTP status codes.

#### Response Example
(No specific JSON response body required for success)
```

--------------------------------

### Update Flow Metadata Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Confirmation response for a successful metadata update request.

```json
{
  "success": true,
}
```

--------------------------------

### WhatsApp Flow Details Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

This is a sample JSON response when retrieving a Flow's details. It includes fields like `id`, `name`, `status`, `categories`, `validation_errors`, and detailed `health_status` information, which indicates if the flow can be used with a specific phone number.

```json
{
  "id": "<Flow-ID>",
  "name": "<Flow-Name>",
  "status": "DRAFT",
  "categories": [ "LEAD_GENERATION" ],
  "validation_errors": [],
  "json_version": "3.0",
  "data_api_version": "3.0",
  "endpoint_uri": "https://example.com",
  "preview": {
    "preview_url": "https://business.facebook.com/wa/manage/flows/55000..../preview/?token=b9d6.....",
    "expires_at": "2023-05-21T11:18:09+0000"
  },
  "whatsapp_business_account": {
    ...
  },
  "application": {
    ...
  },
  "health_status": {
    "can_send_message": "BLOCKED",
    "entities": [
      {
        "entity_type": "FLOW",
        "id": "<Flow-ID>",
        "can_send_message": "BLOCKED",
        "errors": [
          {
            "error_code": 131000,
            "error_description": "endpoint_uri: You need to set the endpoint URI before you can send or publish a flow.",
            "possible_solution": "https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson#top-level-flow-json-properties"
          },
          {
            "error_code": 131000,
            "error_description": "app_check: You need to connect a Meta app to the flow before you can send or publish it.",
            "possible_solution": "https://developers.facebook.com/docs/development/create-an-app"
          }
        ]
      },
      {
        "entity_type": "WABA",
        "id": "<WABA-ID>",
        "can_send_message": "AVAILABLE"
      },
      {
        "entity_type": "BUSINESS",
        "id": "<Business-ID>",
        "can_send_message": "AVAILABLE"
      },
      {
        "entity_type": "APP",
        "id": "<App-ID>",
        "can_send_message": "LIMITED",
        "additional_info": [
          "Your app is not subscribed to the message webhook. This means you will not receive any messages sent to your phone number."
        ]
      }
    ]
  }
}
```

--------------------------------

### Decrypt Incoming Requests

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Decrypt the incoming request body using the private key and passphrase, handling potential decryption errors.

```javascript
let decryptedRequest = null;
try {
  decryptedRequest = decryptRequest(req.body, PRIVATE_KEY, PASSPHRASE);
} catch (err) {
  console.error(err);
  if (err instanceof FlowEndpointException) {
    return res.status(err.statusCode).send();
  }
  return res.status(500).send();
}

const { aesKeyBuffer, initialVectorBuffer, decryptedBody } = decryptedRequest;
console.log("💬 Decrypted Request:", decryptedBody);
```

--------------------------------

### Flow Response Message Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks

This webhook is triggered when a user completes a flow and sends a message back to the WhatsApp chat. It provides details about the flow response.

```APIDOC
## Flow Response Message Webhook

When user completes the flow, a message is sent to WhatsApp chat. You will receive that message through a webhook which you normally use to process chat messages from the user. Below is the structure of flow response message webhook payload:

```json
{
  "messages": [{
    "context": {
      "from": "16315558151",
      "id": "gBGGEiRVVgBPAgm7FUgc73noXjo"
    },
    "from": "<USER_ACCOUNT_NUMBER>",
    "id": "<MESSAGE_ID>",
    "type": "interactive",
    "interactive": {
      "type": "nfm_reply",
      "nfm_reply": {
        "name": "flow",
        "body": "Sent",
        "response_json": "{\"flow_token\": \"<FLOW_TOKEN>\", \"optional_param1\": \"<value1>\", \"optional_param2\": \"<value2>\"}"
      }
    },
    "timestamp": "<MESSAGE_SEND_TIMESTAMP>"
  }]
}
```

### Parameters

- **messages** (array) - Contains message objects.
  - **context** (object) - Context of the message that the user replied to. Context object contains message_id of flows request message and sender number.
    - **from** (string) - User's WhatsApp account number.
    - **id** (string) - Message ID.
  - **from** (string) - Sender's WhatsApp account number.
  - **id** (string) - Message ID.
  - **type** (string) - Always `interactive`.
  - **interactive** (object) - Interactive message object.
    - **type** (string) - Always `nfm_reply`.
    - **nfm_reply** (object) - Non-interactive message reply object.
      - **name** (string) - Always `flow`.
      - **body** (string) - Always `Sent`.
      - **response_json** (string) - Flow-specific data. The structure is either defined in flow JSON or, if flow is using an endpoint, controlled by endpoint.
  - **timestamp** (string) - Time of flow response message.
```

--------------------------------

### Define Flow JSON Structure

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

The base JSON structure for a loan application Flow, defining routing models and screen data.

```json
{
"version": "7.3",
"data_api_version": "3.0",
"routing_model": {
"LOAN": [
"DETAILS"
],
"DETAILS": [
"SUMMARY"
],
"SUMMARY": [
"COMPLETE"
],
"COMPLETE": []
},
"screens": [
{
"id": "LOAN",
"title": "Your pre-approved loan",
"data": {
"tenure": {
"type": "array",
"items": {
"type": "object",
"properties": {
"id": {
"type": "string"
},
"title": {
"type": "string"
}
}
},
"__example__": [
{
"id": "months12",
"title": "12 months"
},
{
"id": "months24",
"title": "24 months"
```

--------------------------------

### Handle Health Check and Error Notifications

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/pre-approved-loan

Responds to 'ping' actions with an 'active' status and acknowledges client errors by logging them and returning an acknowledged status.

```javascript
// handle health check request
if (action === "ping") {
    return {
        version,
        data: {
            status: "active",
        },
    };
}

// handle error notification
if (data?.error) {
    console.warn("Received client error:", data);
    return {
        version,
        data: {
            acknowledged: true,
        },
    };
}
```

--------------------------------

### Flows JSON Template Structure

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

This JSON defines the structure and routing logic for a WhatsApp Flow. It specifies different screens, data types, and how the flow progresses between states like product selection, options, and offers.

```json
{
"version": "7.3",
"data_api_version": "3.0",
"routing_model": {
"PRODUCT_SELECTOR": [
"OPTIONS"
],
"OPTIONS": [
"OFFER"
],
"OFFER": [
"PRODUCT_DETAIL"
]
},
"screens": [
{
"id": "PRODUCT_SELECTOR",
"title": "Black Friday Deals",
"data": {
"products": {
"type": "array",
"items": {
"type": "object",
"properties": {
"id": {
"type": "string"
},
"title": {
"type": "string"
}
}
},
"__example__": [
{
"id": "0_mobile_phones",
"title": "Mobile phones"
},
{
"id": "1_eBook_readers",
"title": "eBook readers"
}
]
}
}
}
]
}
```

--------------------------------

### POST /{FLOW-ID}/publish

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the status of the Flow to 'PUBLISHED'.

```APIDOC
## POST /{FLOW-ID}/publish

### Description
Updates the status of the Flow to "PUBLISHED". Ensure business verification and validation checks are passed before publishing.

### Method
POST

### Endpoint
{BASE-URL}/{FLOW-ID}/publish

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the operation was successful

#### Response Example
{
  "success": true
}
```

--------------------------------

### Value Object Structure

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks

The Value Object contains specific details for the change that triggered the webhook. Its content varies based on the 'event' type.

```APIDOC
## Value Object

Contains details for the change that triggered the webhook. This object is nested within the `changes` array of the `entry` array.

### Fields
- **flow_id** (string) - ID of the flow.
- **threshold** (number) - The alert threshold that was reached or recovered from.
- **event** (string) - Type of webhook notification sent. Possible values include:
  - `FLOW_STATUS_CHANGE`
  - `CLIENT_ERROR_RATE`
  - `ENDPOINT_ERROR_RATE`
  - `ENDPOINT_LATENCY`
  - `ENDPOINT_AVAILABILITY`
- **message** (string) - Detailed message describing webhook.
- **old_status** (string) - Previous status of the flow. Possible values include:
  - `DRAFT`
  - `PUBLISHED`
  - `DEPRECATED`
  - `BLOCKED`
  - `THROTTLED`
- **new_status** (string) - New status of the flow. Possible values include:
  - `DRAFT`
  - `PUBLISHED`
  - `DEPRECATED`
  - `BLOCKED`
  - `THROTTLED`
- **alert_state** (string) - Status of the alert. Possible values include:
  - `ACTIVATED`
  - `DEACTIVATED`
- **requests_count** (integer) - Number of requests used to calculate metric.
- **errors** (array of objects) - An array of error objects describing each error included in the alert. Error objects have the following properties:
  - **error_count** (Integer) - Number of occurrences of the error. Example: 29.
  - **error_rate** (Integer) - Error specific error rate. Example: 16.
  - **error_type** (String) - The name of the error. See Webhook Alerts and Endpoint Error Types section of Error Codes page for details and suggestions for resolutions.
- **p50_latency** (integer) - P50 latency of the endpoint requests.
- **p90_latency** (integer) - P90 latency of the endpoint requests.
- **error_rate** (integer) - Overall error rate for the alert.
```

--------------------------------

### Handle Flow Version Expiry Warning Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This payload is sent when a flow is sent using a version that is about to expire, preventing further usage after the expiry date.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_VERSION_EXPIRY_WARNING",
              "warning": "Your current Flow version will freeze in 21 days. You won't be able to send the Flow after it expires. Please migrate to the recommended version as soon as possible. https://developers.facebook.com/docs/whatsapp/flows/changelogs#currently-supported-versions"
              "flow_id": "6627390910605886",
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### POST /{FLOW-ID}/deprecate

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Marks a published Flow as deprecated.

```APIDOC
## POST /{FLOW-ID}/deprecate

### Description
Once a Flow is published, it cannot be modified or deleted, but can be marked as deprecated.

### Method
POST

### Endpoint
{BASE-URL}/{FLOW-ID}/deprecate

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the operation was successful

#### Response Example
{
  "success": true
}
```

--------------------------------

### Publish a Flow

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the status of a Flow to 'PUBLISHED'. Ensure all validation checks are passed before calling.

```curl
curl -X POST '{BASE-URL}/{FLOW-ID}/publish' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

```json
{
  "success": true
}
```

--------------------------------

### Client Error Rate Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

Information regarding Client Error Rate webhooks, which are triggered when specific error rate thresholds are met or fall below them over a 60-minute period.

```APIDOC
## Webhook Notification: Client Error Rate

### Description
Client error rate is approximate as it’s not available for all the client devices and regions. A notification is sent to you when the error rate for screen navigations on the client goes over one of the following thresholds and then again when it goes below these thresholds.

### Error Rate Thresholds

- 5%
- 10%
- 50%

### Detection Period

The detection period for these thresholds is 60 minutes, which is the period that we calculate the error rate. WhatsApp will only send a webhook if the error rate of the events in the past 60 minutes reaches any of these thresholds or goes below them.

### Value Object Properties for CLIENT_ERROR_RATE

- **event** (string) - `CLIENT_ERROR_RATE`
- **threshold** (number) - The error rate threshold that was reached or recovered from (e.g., 0.05 for 5%).
- **error_rate** (integer) - The overall error rate for the alert.
- **alert_state** (string) - Status of the alert (`ACTIVATED` or `DEACTIVATED`).
- **message** (string) - Detailed message describing the alert.
```

--------------------------------

### Endpoint Latency Webhook Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This webhook alerts you when the p90 latency for endpoint requests exceeds a specified threshold over a 30-minute detection period. It includes flow ID, latency metrics (p90, p50), request count, and the threshold that was breached.

```json
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "ENDPOINT_LATENCY",
            "message": "Flow endpoint latency has reached the p90 threshold in the last 30 minutes. High latency will increase the loading time between screens in the flow, impacting user experience.",
            "flow_id": "691244242662581",
            "p90_latency": 8000,
            "p50_latency": 500,
            "requests_count": 34,
            "threshold": 7000,
            "alert_state": "ACTIVATED",
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### Webhook Notification Object

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

The structure of the webhook notification received by businesses subscribed to WhatsApp Flows events.

```APIDOC
## Webhook Notification Object

### Description
A combination of nested objects of JSON arrays and objects that contain information about a change.

### Parameters
- **object** (string) - The webhook a business has subscribed to.
- **entry** (array of objects) - An array of entry objects.
  - **id** (string) - The WhatsApp Business Account ID.
  - **changes** (array of objects) - An array of change objects.
    - **value** (object) - A value object containing event details.
    - **field** (string) - Notification type, value will be 'flows'.
```

--------------------------------

### Update Flow JSON

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the Flow JSON for a specific Flow. The file must be attached as form-data with the name 'flow.json' and asset_type 'FLOW_JSON'.

```bash
curl -X POST '{BASE-URL}/{FLOW_ID}/assets' \
--header 'Authorization: Bearer {ACCESS-TOKEN}' \
--form 'file=@"/path/to/file";type=application/json' \
--form 'name="flow.json"' \
--form 'asset_type="FLOW_JSON"' # file must be attached as form-data
```

--------------------------------

### Client Error Rate Webhook

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks

Information about Client Error Rate Webhooks, which are triggered when client-side error rates exceed predefined thresholds.

```APIDOC
## POST /webhook

### Description
Receives webhook notifications for client error rate changes in WhatsApp Flows.

### Method
POST

### Endpoint
/webhook

### Request Body
- **object** (string) - Required - The webhook a business has subscribed to.
- **entry** (array of objects) - Required - An array of entry objects.
  - **id** (string) - Required - The WhatsApp Business Account ID.
  - **changes** (Array of objects) - Required - An array of change objects.
    - **value** (Object) - Required - Contains details for the change.
      - **event** (string) - Required - Type of notification, must be `CLIENT_ERROR_RATE`.
      - **message** (string) - Optional - Detailed message describing the webhook.
      - **flow_id** (string) - Optional - ID of the flow if applicable.
      - **threshold** (number) - Required - The error rate threshold that was reached or recovered from (e.g., 0.05, 0.10, 0.50).
      - **error_rate** (integer) - Required - The calculated client error rate.
      - **alert_state** (string) - Required - Status of the alert (`ACTIVATED` or `DEACTIVATED`).
    - **field** (String) - Required - Notification type, must be `flows`.

### Request Example
```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "CLIENT_ERROR_RATE",
              "message": "Client error rate exceeded 5%",
              "flow_id": "6627390910605886",
              "threshold": 5,
              "error_rate": 6,
              "alert_state": "ACTIVATED"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

### Response
#### Success Response (200)
- **status** (string) - Indicates success.

#### Response Example
```json
{
  "status": "success"
}
```
```

--------------------------------

### Client Error Rate Webhook Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This webhook is triggered when the flow client request error rate exceeds a defined threshold. It includes details on the error rate, threshold, and specific error types like INVALID_SCREEN_TRANSITION or PUBLIC_KEY_MISSING.

```json
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "CLIENT_ERROR_RATE",
            "message": "The flow client request error rate has reached the 5% threshold in the last 60 minutes. A higher error rate will make it harder for users to complete the flow, resulting in drop-offs.",
            "flow_id": "691244242662581",
            "error_rate": 14.28,
            "threshold": 10,
            "alert_state": "ACTIVATED",
            "errors": [
              {
                "error_type": "INVALID_SCREEN_TRANSITION",
                "error_rate": 66.66,
                "error_count": 2
              },
              {
                "error_type": "PUBLIC_KEY_MISSING",
                "error_rate": 33.33,
                "error_count": 1
              },
            ],
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### Validate Request Signature

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Verify the request signature to ensure authenticity, returning a 432 status code if validation fails.

```javascript
if(!isRequestSignatureValid(req)) {
// Return status code 432 if request signature does not match.
// To learn more about return error codes visit: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes#endpoint_error_codes
  return res.status(432).send();
}
```

--------------------------------

### Insurance Quote Flow JSON Template

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/health-insurance

The structural definition for the insurance quote Flow, including screen routing and data API versioning.

```json
{
"version": "7.3",
"data_api_version": "3.0",
"routing_model": {
"APPLICANTS": [
"COVER_LEVEL"
],
"COVER_LEVEL": [
"EXCESS"
],
"EXCESS": [
"DETAILS"
],
"DETAILS": [
"YOUR_HEALTH",
"ADDITIONAL_APPLICANT"
],
"YOUR_HEALTH": [
"ADDITIONAL_APPLICANT",
"POLICY_SELECTION"
],
"ADDITIONAL_APPLICANT": [
"POLICY_SELECTION"
],
"POLICY_SELECTION": [
"SELECTED_POLICY"
],
"SELECTED_POLICY": [
"YOUR_QUOTE"
],
"YOUR_QUOTE": [
"SUMMARY"
],
"SUMMARY": []
},
"screens": [
{
"id": "APPLICANTS",
"title": "Applicants",
"data": {
"cover": {

```

--------------------------------

### Valid PhotoPicker Usage in data_exchange Payload

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

The PhotoPicker component's value must be used as a top-level string property within the payload of 'data_exchange' or 'complete' actions. Ensure direct referencing without nested objects.

```json
"on-click-action":
{
   "name": "data_exchange",
   "payload": 
    {
      "media": "${form.photo_picker}"
    }
}
```

--------------------------------

### Valid DocumentPicker data_exchange action payload

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

The DocumentPicker component's value must be a top-level string property in the action payload for 'data_exchange' or 'complete' actions.

```json
"on-click-action": 
{
   "name": "data_exchange",
   "payload": 
    {
      "media": "${form.document_picker}"
    }
}
```

--------------------------------

### Retrieve Flows List Response

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

The API returns a JSON object containing a list of Flow objects with their status, categories, and validation errors, along with paging cursors.

```json
{
    "data": [
    {
        "id": "flow-1",
        "name": "flow 1",
        "status": "DRAFT",
        "categories": [ "CONTACT_US" ],
        "validation_errors": []
    },
    {
        "id": "flow-2",
        "name": "flow 2",
        "status": "PUBLISHED",
        "categories": [ "SURVEY" ],
        "validation_errors": []
    },
    {
        "id": "flow-3",
        "name": "flow 3",
        "status": "DRAFT",
        "categories": [ "LEAD_GENERATION" ],
        "validation_errors": []
    }
    ],
    "paging": {
        "cursors": {
            "before": "QVFI...",
            "after": "QVFI..."
        }
    }
}
```

--------------------------------

### Flow Creation Webhook Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This JSON payload indicates a webhook notification for a newly created flow. The `old_status` field is absent, and the `new_status` is set to 'DRAFT'.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 has been created with DRAFT status",
              "flow_id": "6627390910605886",
              "new_status": "DRAFT"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```

--------------------------------

### Updating a Flow's Flow JSON

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the Flow JSON for a specified Flow. The file must be attached as form-data.

```APIDOC
## POST /websites/developers_facebook_whatsapp_flows/{FLOW_ID}/assets

### Description
Updates the Flow JSON for a specified Flow. The file must be attached as form-data.

### Method
POST

### Endpoint
`{BASE-URL}/{FLOW_ID}/assets`

### Parameters
#### Request Body
- **name** (string) - Required - Flow asset name. The value must be `flow.json`
- **asset_type** (string) - Required - Asset type. The value must be `FLOW_JSON`
- **file** (json) - Required - File with the JSON content. The size is limited to 10 MB

### Request Example
```curl
curl -X POST '{BASE-URL}/{FLOW_ID}/assets' \
--header 'Authorization: Bearer {ACCESS-TOKEN}' \
--form 'file=@"/path/to/file";type=application/json' \
--form 'name="flow.json"' \
--form 'asset_type="FLOW_JSON"'
```

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the operation was successful.
- **validation_errors** (array) - Contains a list of validation errors if any.
  - **error** (string) - Error code.
  - **error_type** (string) - Type of the error.
  - **message** (string) - Detailed error message.
  - **line_start** (integer) - Starting line number of the error.
  - **line_end** (integer) - Ending line number of the error.
  - **column_start** (integer) - Starting column number of the error.
  - **column_end** (integer) - Ending column number of the error.
  - **pointers** (array) - Specific locations of the error within the JSON.
    - **line_start** (integer) - Starting line number of the pointer.
    - **line_end** (integer) - Ending line number of the pointer.
    - **column_start** (integer) - Starting column number of the pointer.
    - **column_end** (integer) - Ending column number of the pointer.
    - **path** (string) - Path to the error in the JSON structure.

#### Response Example
```json
{
  "success": true,
  "validation_errors": [
    {
      "error": "INVALID_PROPERTY_VALUE",
      "error_type": "FLOW_JSON_ERROR",
      "message": "Invalid value found for property 'type'.",
      "line_start": 10,
      "line_end": 10,
      "column_start": 21,
      "column_end": 34,
      "pointers": [
       {
         "line_start": 10,
         "line_end": 10,
         "column_start": 21,
         "column_end": 34,
         "path": "screens [0]. layout.children [0].type"
       }
      ]
    }
  ]
}
```
```

--------------------------------

### Extract Data from Decrypted Message

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/personalised-offer

Extracts necessary data like screen, version, action, and flow_token from the decrypted message body. This is a prerequisite for processing any Flow request.

```javascript
const { screen, data, version, action, flow_token } = decryptedBody;
```

--------------------------------

### Update Flow Metadata

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Updates the name or categories of an existing flow using the flow ID.

```curl
curl -X POST '{BASE-URL}/{FLOW-ID}' \
--header 'Authorization: Bearer {ACCESS-TOKEN}' \
--header "Content-Type: application/json" \
--data '{
  "name": "New flow name"
}'
```

--------------------------------

### Webhook Notification Object Structure

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/healthmonitoring/webhooks

The Webhook Notification Object is a JSON structure containing information about changes related to subscribed webhooks. It includes an 'entry' array, where each entry contains 'id', 'time', and a 'changes' array.

```APIDOC
## Webhook Notification Object

A combination of nested objects of JSON arrays and objects that contain information about a change.

### Fields
- **object** (string) - The webhook a business has subscribed to.
- **entry** (array of objects) - An array of entry objects. Entry objects have the following properties:
  - **id** (string) - The WhatsApp Business Account ID for the business that is subscribed to the webhook.
  - **changes** (Array of objects) - An array of change objects. Change objects have the following properties:
    - **value** (Object) - A value object. See Value Object.
    - **field** (String) - Notification type. Value will be flows.
```

--------------------------------

### Invalid DocumentPicker data_exchange action payload

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

The DocumentPicker component's value cannot be nested within an object in the action payload.

```json
"on-click-action":
{
  "name": "data_exchange",
  "payload": 
   {
    "media": {"document": "${form.document_picker}"}
   }
}
```

--------------------------------

### Receive Flow Response Message - JSON Payload

Source: https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/receiveflowresponse

This JSON payload represents a message received from a user after a flow has been completed. The `response_json` field contains the flow-specific data, including a `flow_token` for identification.

```json
{
  "messages": [{
    "context": {
      "from": "16315558151",
      "id": "gBGGEiRVVgBPAgm7FUgc73noXjo"
    },
    "from": "<USER_ACCOUNT_NUMBER>",
    "id": "<MESSAGE_ID>",
    "type": "interactive",
    "interactive": {
      "type": "nfm_reply",
      "nfm_reply": {
        "name": "flow",
        "body": "Sent",
        "response_json": "{\"flow_token\": \"<FLOW_TOKEN>\", \"optional_param1\": \"<value1>\", \"optional_param2\": \"<value2>\"}"
      }
    },
    "timestamp": "<MESSAGE_SEND_TIMESTAMP>"
  }]
}
```

--------------------------------

### Deprecate a Flow

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Marks a published Flow as deprecated, preventing further modifications or deletions.

```curl
curl -X POST '{BASE-URL}/{FLOW-ID}/deprecate' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

```json
{
  "success": true,
}
```

--------------------------------

### Delete a Flow

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Deletes a Flow that is currently in DRAFT status.

```bash
curl -X DELETE '{BASE-URL}/{FLOW-ID}' \
--header 'Authorization: Bearer {ACCESS-TOKEN}'
```

--------------------------------

### Deleting a Flow

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowsapi

Deletes a Flow that is in `DRAFT` status.

```APIDOC
## DELETE /websites/developers_facebook_whatsapp_flows/{FLOW-ID}

### Description
Deletes a Flow while it is in `DRAFT` status.

### Method
DELETE

### Endpoint
`{BASE-URL}/{FLOW-ID}`

### Response
#### Success Response (200)
- **success** (boolean) - Indicates if the operation was successful.

#### Response Example
```json
{
  "success": true
}
```
```

--------------------------------

### Invalid PhotoPicker Usage in data_exchange Payload

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/media_upload

Avoid nesting the PhotoPicker component's value within an object in the action payload. It must be a direct string reference.

```json
"on-click-action":
{
  "name": "data_exchange",
  "payload": 
   {
    "media": {"photo": "${form.photo_picker}"}
   }
}
```

--------------------------------

### Endpoint Error Rate Webhook Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/flowswebhooks

This notification is sent when the error rate for endpoint requests surpasses a threshold over a 30-minute period. It details the event, flow ID, error rate, threshold, and specific errors like CAPABILITY_ERROR or TIMEOUT.

```json
{
  "entry": [
    {
      "id": "106181168862417",
      "time": 1674160476,
      "changes": [
        {
          "value": {
            "event": "ENDPOINT_ERROR_RATE",
            "message": "The flow endpoint request error rate has reached the 10% threshold in the last 30 minutes. A higher error rate will make it harder for users to complete the flow, resulting in drop-offs.",
            "flow_id": "691244242662581",
            "error_rate": 14.28,
            "threshold": 10,
            "alert_state": "ACTIVATED",
            "errors": [
              {
                "error_type": "CAPABILITY_ERROR",
                "error_rate": 66.66,
                "error_count": 2
              },
              {
                "error_type": "TIMEOUT",
                "error_rate": 33.33,
                "error_count": 1
              },
            ],
          },
          "field": "flows"
        }
      ]
    }
  ],
  "object": "whatsapp_business_account"
}
```

--------------------------------

### Flow Status Change Webhook Notification

Source: https://developers.facebook.com/docs/whatsapp/flows/reference/qualmgmtwebhook

This JSON payload represents a webhook notification sent when a flow's status changes, such as from DRAFT to PUBLISHED. It includes details like the flow ID and the old and new statuses.

```json
{
  "entry": [
      {
        "id": "644600416743275",
        "time": 1684969340,
        "changes": [
          {
            "value": {
              "event": "FLOW_STATUS_CHANGE",
              "message": "Flow Webhook 3 changed status from DRAFT to PUBLISHED",
              "flow_id": "6627390910605886",
              "old_status": "DRAFT",
              "new_status": "PUBLISHED"
            },
            "field": "flows"
          }
        ]
      }
    ],
    "object": "whatsapp_business_account"
}
```