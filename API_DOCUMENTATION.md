# Auxray Energy API Documentation for Frontend Integration

> **Base URL:** `http://localhost:5000`  
> **Swagger Interactive Docs:** `http://localhost:5000/api/api-docs`  
> **Authentication Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## Table of Contents
1. [Authentication & Roles](#1-authentication--roles)
2. [Brands API](#2-brands-api)
   - [Model Schema](#brand-model-schema)
   - [1. Create Brand](#1-create-brand)
   - [2. Get All Brands (Optionally Filter by Category)](#2-get-all-brands)
   - [3. Get Brands Grouped by Category](#3-get-brands-grouped-by-category)
   - [4. Get All Brand Categories](#4-get-all-brand-categories)
   - [5. Get Brand by ID](#5-get-brand-by-id)
   - [6. Update Brand](#6-update-brand)
   - [7. Delete Brand](#7-delete-brand)
3. [Quotes API (with Brand References)](#3-quotes-api)
   - [Quote Model Schema](#quote-model-schema)
   - [1. Create Quote](#1-create-quote)
   - [2. Get Quotes by Status](#2-get-quotes-by-status)
   - [3. Update Quote](#3-update-quote)

---

## 1. Authentication & Roles

Include the JWT token in request headers for all protected endpoints:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Roles Breakdown:
- **`SUPER_ADMIN`**, **`CHILD_ADMIN`**: Full administrative access (Create, Read, Update, Delete Brands & Quotes).
- **`LEAD_MANAGER`**: Can create and update Quotes.
- **`SALES_EXECUTIVE`**: Can create Quotes and view Quotes/Brands.
- **`INSTALLATION_MANAGER`**: Can view Quotes/Brands.

---

## 2. Brands API

### Brand Model Schema

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String (ObjectId) | Yes (Auto) | Unique MongoDB identifier |
| `company_name` | String | **Yes** | Company / Brand Name |
| `category` | String | **Yes** | Allowed values: `"Panel brand"`, `"Invertor brand"`, `"Cables brand"` |
| `logo` | String | No | Image URL (Uploaded to S3 or provided string link) |
| `description` | String | No | Brief brand description |
| `createdAt` | Date | Yes (Auto) | Creation timestamp |
| `updatedAt` | Date | Yes (Auto) | Last update timestamp |

---

### 1. Create Brand
**POST** `/api/brands/create-brand` (or `POST /api/brands`)  
**Access:** Private (`SUPER_ADMIN`, `CHILD_ADMIN`)  
**Content-Type:** `multipart/form-data` or `application/json`

#### Request Payload (`multipart/form-data` or `application/json`):
```json
{
  "company_name": "Tata Power Solar",
  "category": "Panel brand",
  "description": "Tier 1 Solar Panel Manufacturer",
  "logo": "https://drive.google.com/file/d/sample-logo.png"
}
```
*Note: If uploading a file directly from frontend file input, attach it under key `logo` using `FormData`.*

#### Example `FormData` JS Code:
```javascript
const formData = new FormData();
formData.append("company_name", "Tata Power Solar");
formData.append("category", "Panel brand");
formData.append("description", "Tier 1 Solar Panel Manufacturer");
formData.append("logo", fileInput.files[0]); // Optional logo file
```

#### Response `201 Created`:
```json
{
  "message": "Brand created successfully",
  "brand": {
    "_id": "66b1e2a5f89c001122334455",
    "company_name": "Tata Power Solar",
    "category": "Panel brand",
    "logo": "https://auxray-bucket.s3.amazonaws.com/brands/logo-1722460000.png",
    "description": "Tier 1 Solar Panel Manufacturer",
    "createdAt": "2026-07-31T22:00:00.000Z",
    "updatedAt": "2026-07-31T22:00:00.000Z"
  }
}
```

#### Error Responses:
- **`400 Bad Request`**:
  ```json
  {
    "message": "company_name and category are required"
  }
  ```
- **`403 Forbidden`**:
  ```json
  {
    "message": "Only admins can create brands"
  }
  ```

---

### 2. Get All Brands
**GET** `/api/brands`  
**Access:** Private  
**Query Parameters:**
- `category` *(optional)*: Filter by category (e.g. `?category=Panel brand`, `?category=Invertor brand`, `?category=Cables brand`)

#### Request Example:
```http
GET /api/brands?category=Panel brand
```

#### Response `200 OK`:
```json
{
  "count": 2,
  "brands": [
    {
      "_id": "66b1e2a5f89c001122334455",
      "company_name": "Tata Power Solar",
      "category": "Panel brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png",
      "description": "Tier 1 Solar Panel Manufacturer",
      "createdAt": "2026-07-31T22:00:00.000Z",
      "updatedAt": "2026-07-31T22:00:00.000Z"
    },
    {
      "_id": "66b1e2a5f89c001122334456",
      "company_name": "Adani Solar",
      "category": "Panel brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/adani.png",
      "description": "High Efficiency Mono PERC & TOPCon Panels",
      "createdAt": "2026-07-31T21:30:00.000Z",
      "updatedAt": "2026-07-31T21:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Brands Grouped by Category
**GET** `/api/brands/grouped`  
**Access:** Private (`SUPER_ADMIN`, `CHILD_ADMIN`)

#### Response `200 OK`:
```json
{
  "count": 3,
  "data": [
    {
      "category": "Cables brand",
      "brands": [
        {
          "_id": "66b1e2a5f89c001122334477",
          "company_name": "Polycab",
          "category": "Cables brand",
          "logo": "https://auxray-bucket.s3.amazonaws.com/brands/polycab.png"
        },
        {
          "_id": "66b1e2a5f89c001122334478",
          "company_name": "Havells",
          "category": "Cables brand",
          "logo": "https://auxray-bucket.s3.amazonaws.com/brands/havells.png"
        }
      ]
    },
    {
      "category": "Invertor brand",
      "brands": [
        {
          "_id": "66b1e2a5f89c001122334466",
          "company_name": "Growatt",
          "category": "Invertor brand",
          "logo": "https://auxray-bucket.s3.amazonaws.com/brands/growatt.png"
        },
        {
          "_id": "66b1e2a5f89c001122334467",
          "company_name": "Solis",
          "category": "Invertor brand",
          "logo": "https://auxray-bucket.s3.amazonaws.com/brands/solis.png"
        }
      ]
    },
    {
      "category": "Panel brand",
      "brands": [
        {
          "_id": "66b1e2a5f89c001122334455",
          "company_name": "Tata Power Solar",
          "category": "Panel brand",
          "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png"
        }
      ]
    }
  ]
}
```

---

### 4. Get All Brand Categories
**GET** `/api/brands/categories`  
**Access:** Private

#### Response `200 OK`:
```json
{
  "count": 3,
  "categories": [
    "Panel brand",
    "Invertor brand",
    "Cables brand"
  ]
}
```

---

### 5. Get Brand by ID
**GET** `/api/brands/:id`  
**Access:** Private

#### Response `200 OK`:
```json
{
  "brand": {
    "_id": "66b1e2a5f89c001122334455",
    "company_name": "Tata Power Solar",
    "category": "Panel brand",
    "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png",
    "description": "Tier 1 Solar Panel Manufacturer",
    "createdAt": "2026-07-31T22:00:00.000Z",
    "updatedAt": "2026-07-31T22:00:00.000Z"
  }
}
```

---

### 6. Update Brand
**PUT** `/api/brands/:id`  
**Access:** Private (`SUPER_ADMIN`, `CHILD_ADMIN`)  
**Content-Type:** `multipart/form-data` or `application/json`

#### Request Payload:
```json
{
  "company_name": "Tata Power Solar Systems",
  "category": "Panel brand",
  "description": "Updated brand details"
}
```

#### Response `200 OK`:
```json
{
  "message": "Brand updated successfully",
  "brand": {
    "_id": "66b1e2a5f89c001122334455",
    "company_name": "Tata Power Solar Systems",
    "category": "Panel brand",
    "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png",
    "description": "Updated brand details",
    "updatedAt": "2026-07-31T22:10:00.000Z"
  }
}
```

---

### 7. Delete Brand
**DELETE** `/api/brands/:id`  
**Access:** Private (`SUPER_ADMIN`, `CHILD_ADMIN`)

#### Response `200 OK`:
```json
{
  "message": "Brand deleted successfully"
}
```

---

## 3. Quotes API

### Quote Model Schema

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | String (ObjectId) | Yes (Auto) | Quote ID |
| `lead_id` | String (ObjectId) | **Yes** | References `Lead` |
| `created_by` | String (ObjectId) | Yes (Auto) | References `User` who created the quote |
| `structure_type` | String | **Yes** | Allowed: `"STANDARD"`, `"EV1"`, `"EV2"` |
| `noOfFloors` | String | No | e.g. `"G+1"` |
| `noOfKWs` | Number | **Yes** | Plant capacity in kW |
| `phase` | String | **Yes** | Allowed: `"SINGLE_PHASE"`, `"THREE_PHASE"` |
| `typeOfRoof` | String | **Yes** | Allowed: `"RCC"`, `"TIN"`, `"ASBESTOS"`, `"CONCRETE"`, `"METAL"` |
| `panelsType` | String | **Yes** | Allowed: `"STANDARD"`, `"TOPCon"`, `"MONO PERC"` |
| `panel_brand` | String (ObjectId) | No | References `Brand` (`category: "Panel brand"`) |
| `invertor_brand` | String (ObjectId) | No | References `Brand` (`category: "Invertor brand"`) |
| `cables_brand` | String (ObjectId) | No | References `Brand` (`category: "Cables brand"`) |
| `amount` | Number | **Yes** | Total quote amount |
| `discount` | Number | No | Overall quote discount |
| `products` | Array of Objects | **Yes** | Line items `[{ product_id, count, discount }]` |
| `status` | String | Default: `"PENDING"` | `"PENDING"`, `"MODIFY"`, `"APPROVED"`, `"REJECTED"` |
| `remarksForStructure` | String | No | Structural remarks |
| `notes` | String | No | Additional notes |

*Note: For brand keys, both `snake_case` (`panel_brand`, `invertor_brand`, `cables_brand`) and `camelCase` (`panelBrand`, `invertorBrand`/`inverterBrand`, `cablesBrand`) are accepted in request bodies.*

---

### 1. Create Quote
**POST** `/api/quotes/create-quote`  
**Access:** Private (`SALES_EXECUTIVE`, `LEAD_MANAGER`, `CHILD_ADMIN`, `SUPER_ADMIN`)  
**Content-Type:** `application/json`

#### Request Payload:
```json
{
  "lead_id": "66a987654321001122334455",
  "structure_type": "EV1",
  "noOfFloors": "G+2",
  "noOfKWs": 5,
  "phase": "THREE_PHASE",
  "typeOfRoof": "RCC",
  "panelsType": "TOPCon",
  "panel_brand": "66b1e2a5f89c001122334455",
  "invertor_brand": "66b1e2a5f89c001122334466",
  "cables_brand": "66b1e2a5f89c001122334477",
  "discount": 2000,
  "amount": 150000,
  "remarksForStructure": "Elevated structure required on RCC roof",
  "products": [
    {
      "product_id": "66a111223344556677889900",
      "count": 10,
      "discount": 500
    }
  ]
}
```

#### Response `201 Created`:
```json
{
  "message": "Quote created successfully",
  "quote": {
    "_id": "66c100001111222233334444",
    "created_by": "66a000000000000000000001",
    "lead_id": "66a987654321001122334455",
    "structure_type": "EV1",
    "noOfFloors": "G+2",
    "noOfKWs": 5,
    "phase": "THREE_PHASE",
    "typeOfRoof": "RCC",
    "panelsType": "TOPCon",
    "panel_brand": {
      "_id": "66b1e2a5f89c001122334455",
      "company_name": "Tata Power Solar",
      "category": "Panel brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png"
    },
    "invertor_brand": {
      "_id": "66b1e2a5f89c001122334466",
      "company_name": "Growatt",
      "category": "Invertor brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/growatt.png"
    },
    "cables_brand": {
      "_id": "66b1e2a5f89c001122334477",
      "company_name": "Polycab",
      "category": "Cables brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/polycab.png"
    },
    "discount": 2000,
    "amount": 150000,
    "remarksForStructure": "Elevated structure required on RCC roof",
    "products": [
      {
        "product_id": "66a111223344556677889900",
        "count": 10,
        "discount": 500,
        "_id": "66c100001111222233334445"
      }
    ],
    "status": "PENDING",
    "rejection_reason": null,
    "createdAt": "2026-07-31T22:15:00.000Z",
    "updatedAt": "2026-07-31T22:15:00.000Z"
  }
}
```

---

### 2. Get Quotes by Status
**GET** `/api/quotes/:status`  
**Access:** Private (`SALES_EXECUTIVE`, `LEAD_MANAGER`, `CHILD_ADMIN`, `SUPER_ADMIN`, `INSTALLATION_MANAGER`)  
**Path Parameters:**
- `status`: Allowed values: `all`, `pending`, `approved`, `rejected`, `modify`

**Query Parameters:**
- `lead_id` *(optional)*: Filter quotes for a specific lead ID

#### Request Example:
```http
GET /api/quotes/pending?lead_id=66a987654321001122334455
```

#### Response `200 OK`:
```json
{
  "count": 1,
  "quotes": [
    {
      "_id": "66c100001111222233334444",
      "lead_id": {
        "_id": "66a987654321001122334455",
        "client_name": "John Doe",
        "phone_number": "9876543210",
        "location": "Hyderabad"
      },
      "structure_type": "EV1",
      "noOfFloors": "G+2",
      "noOfKWs": 5,
      "phase": "THREE_PHASE",
      "typeOfRoof": "RCC",
      "panelsType": "TOPCon",
      "panel_brand": {
        "_id": "66b1e2a5f89c001122334455",
        "company_name": "Tata Power Solar",
        "category": "Panel brand",
        "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png"
      },
      "invertor_brand": {
        "_id": "66b1e2a5f89c001122334466",
        "company_name": "Growatt",
        "category": "Invertor brand",
        "logo": "https://auxray-bucket.s3.amazonaws.com/brands/growatt.png"
      },
      "cables_brand": {
        "_id": "66b1e2a5f89c001122334477",
        "company_name": "Polycab",
        "category": "Cables brand",
        "logo": "https://auxray-bucket.s3.amazonaws.com/brands/polycab.png"
      },
      "products": [
        {
          "product_id": {
            "_id": "66a111223344556677889900",
            "product_name": "540W Mono PERC Panel",
            "cost": "₹18,500",
            "category": "Solar Panels"
          },
          "count": 10,
          "discount": 500
        }
      ],
      "amount": 150000,
      "discount": 2000,
      "status": "PENDING",
      "createdAt": "2026-07-31T22:15:00.000Z",
      "updatedAt": "2026-07-31T22:15:00.000Z"
    }
  ]
}
```

---

### 3. Update Quote
**PATCH** `/api/quotes/:id`  
**Access:** Private (`SUPER_ADMIN`, `CHILD_ADMIN`, `LEAD_MANAGER`, `SALES_EXECUTIVE`)  
**Content-Type:** `application/json`

#### Request Payload Example (Updating Status & Brands):
```json
{
  "status": "APPROVED",
  "panel_brand": "66b1e2a5f89c001122334455",
  "invertor_brand": "66b1e2a5f89c001122334466",
  "cables_brand": "66b1e2a5f89c001122334477"
}
```

#### Response `200 OK`:
```json
{
  "message": "Quote updated successfully",
  "quote": {
    "_id": "66c100001111222233334444",
    "lead_id": {
      "_id": "66a987654321001122334455",
      "client_name": "John Doe",
      "phone_number": "9876543210",
      "location": "Hyderabad",
      "status": "OPEN",
      "currentStage": "REGISTRATION_PROCESS"
    },
    "structure_type": "EV1",
    "noOfFloors": "G+2",
    "noOfKWs": 5,
    "phase": "THREE_PHASE",
    "typeOfRoof": "RCC",
    "panelsType": "TOPCon",
    "panel_brand": {
      "_id": "66b1e2a5f89c001122334455",
      "company_name": "Tata Power Solar",
      "category": "Panel brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/tata.png"
    },
    "invertor_brand": {
      "_id": "66b1e2a5f89c001122334466",
      "company_name": "Growatt",
      "category": "Invertor brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/growatt.png"
    },
    "cables_brand": {
      "_id": "66b1e2a5f89c001122334477",
      "company_name": "Polycab",
      "category": "Cables brand",
      "logo": "https://auxray-bucket.s3.amazonaws.com/brands/polycab.png"
    },
    "products": [
      {
        "product_id": {
          "_id": "66a111223344556677889900",
          "product_name": "540W Mono PERC Panel",
          "cost": "₹18,500",
          "category": "Solar Panels"
        },
        "count": 10,
        "discount": 500
      }
    ],
    "amount": 150000,
    "discount": 2000,
    "status": "APPROVED",
    "rejection_reason": "",
    "createdAt": "2026-07-31T22:15:00.000Z",
    "updatedAt": "2026-07-31T22:20:00.000Z"
  }
}
```

---
