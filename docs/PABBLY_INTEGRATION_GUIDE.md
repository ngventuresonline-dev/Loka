# Pabbly Integration Guide for Lokazen Platform

This guide provides step-by-step instructions for connecting Pabbly Connect with the Lokazen platform and setting up routers for all form types.

## 🔗 Pabbly Webhook URL

**Webhook Endpoint:**
```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc
```

**Environment Variable:**
Set `PABBLY_WEBHOOK_URL` in your `.env` file to override the default URL.

---

## 📋 All Available Form Types

The platform sends webhook data to Pabbly for the following form types:

### 1. **Brand Lead Creation** (`brand_lead_creation`)
**API Endpoint:** `POST /api/leads/create`  
**Triggered When:** Brand completes onboarding/search flow

**Payload Structure:**
```json
{
  "formType": "brand_lead_creation",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "businessType": "cafe_qsr",
  "locations": ["Indiranagar", "Koramangala"],
  "budgetMin": 50000,
  "budgetMax": 150000,
  "sizeMin": 500,
  "sizeMax": 2000
}
```

**Fields:**
- `name` (string, optional): Lead name
- `email` (string, optional): Email address
- `phone` (string, optional): Phone number
- `businessType` (string, nullable): Business type (e.g., "cafe_qsr", "restaurant", "retail_fashion")
- `locations` (array): Preferred locations
- `budgetMin` (number, nullable): Minimum budget
- `budgetMax` (number, nullable): Maximum budget
- `sizeMin` (number, nullable): Minimum size in sqft
- `sizeMax` (number, nullable): Maximum size in sqft

---

### 2. **Owner Lead Creation** (`owner_lead_creation`)
**API Endpoint:** `POST /api/leads/owner`  
**Triggered When:** Owner submits initial information

**Payload Structure:**
```json
{
  "formType": "owner_lead_creation",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "name": "Property Owner",
  "email": "owner@example.com",
  "phone": "+91-9876543210"
}
```

**Fields:**
- `name` (string, optional): Owner name
- `email` (string, optional): Email address
- `phone` (string, optional): Phone number

---

### 3. **User Registration** (`user_registration`)
**API Endpoint:** `POST /api/auth/register`  
**Triggered When:** New user registers (brand or owner)

**Payload Structure:**
```json
{
  "formType": "user_registration",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "userType": "brand"
}
```

**Fields:**
- `name` (string, required): Full name
- `email` (string, required): Email address
- `phone` (string, optional): Phone number
- `userType` (string, required): "brand" | "owner" | "admin"

---

### 4. **Contact Team Form** (`contact_team`)
**API Endpoint:** `POST /api/contact-team`  
**Triggered When:** User submits "Contact Team" form

**Payload Structure:**
```json
{
  "formType": "contact_team",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "bestTime": "Evening",
  "additionalRequirements": "Need parking space",
  "searchCriteria": {
    "location": "Indiranagar",
    "budget": "50000-100000"
  }
}
```

**Fields:**
- `name` (string, required): Contact name
- `phone` (string, required): Phone number
- `bestTime` (string, optional): Best time to contact
- `additionalRequirements` (string, optional): Additional requirements
- `searchCriteria` (object, optional): Search criteria object

---

### 5. **Expert Connect** (`expert_connect`)
**API Endpoint:** `POST /api/expert/connect`  
**Triggered When:** Brand requests to connect with expert for a property

**Payload Structure:**
```json
{
  "formType": "expert_connect",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "propertyId": "prop-12345",
  "brandName": "Coffee Shop",
  "email": "brand@example.com",
  "phone": "+91-9876543210",
  "scheduleDateTime": "2024-01-20T14:00:00.000Z",
  "notes": "Interested in viewing the property"
}
```

**Fields:**
- `propertyId` (string, required): Property ID
- `brandName` (string, required): Brand/business name
- `email` (string, optional): Email address
- `phone` (string, required): Phone number
- `scheduleDateTime` (string, required): ISO datetime string
- `notes` (string, required): Additional notes

---

### 6. **Requirements Lead** (`requirements_lead`)
**API Endpoint:** `POST /api/leads/requirements`  
**Triggered When:** User submits requirements form from properties page

**Payload Structure:**
```json
{
  "formType": "requirements_lead",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john@example.com",
  "requirements": "Looking for retail space",
  "searchCriteria": {
    "location": "Koramangala",
    "size": "1000-2000"
  },
  "source": "properties_results_page"
}
```

**Fields:**
- `name` (string, required): Lead name
- `phone` (string, required): Phone number
- `email` (string, required): Email address
- `requirements` (string, optional): Requirements description
- `searchCriteria` (object, optional): Search criteria
- `source` (string, optional): Source of the lead

---

### 7. **Property Submission** (`property_submission`)
**API Endpoint:** `POST /api/owner/property`  
**Triggered When:** Owner submits a new property listing

**Payload Structure:**
```json
{
  "formType": "property_submission",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "ownerId": "user-12345",
  "propertyId": "prop-12345",
  "propertyType": "retail",
  "location": "Indiranagar, Bangalore",
  "size": 1500,
  "rent": 75000,
  "deposit": 150000,
  "amenities": ["parking", "power_backup"],
  "ownerName": "Property Owner",
  "ownerEmail": "owner@example.com",
  "ownerPhone": "+91-9876543210"
}
```

**Fields:**
- `ownerId` (string, required): Owner user ID
- `propertyId` (string, required): Property ID
- `propertyType` (string, required): Property type (office, retail, warehouse, restaurant, other)
- `location` (string, required): Property location
- `size` (number, optional): Size in sqft
- `rent` (number, optional): Monthly rent
- `deposit` (number, optional): Security deposit
- `amenities` (array, optional): List of amenities
- `ownerName` (string, optional): Owner name
- `ownerEmail` (string, optional): Owner email
- `ownerPhone` (string, optional): Owner phone

---

### 8. **Visit Schedule** (`visit_schedule`)
**API Endpoint:** `POST /api/visits/schedule`  
**Triggered When:** Brand schedules a property visit

**Payload Structure:**
```json
{
  "formType": "visit_schedule",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "propertyId": "prop-12345",
  "dateTime": "2024-01-20T14:00:00.000Z",
  "note": "Would like to see the property",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "company": "Coffee Shop Inc"
}
```

**Fields:**
- `propertyId` (string, required): Property ID
- `dateTime` (string, required): ISO datetime string
- `note` (string, optional): Visit notes
- `name` (string, required): Visitor name
- `email` (string, required): Email address
- `phone` (string, required): Phone number
- `company` (string, optional): Company name

---

### 9. **Inquiry Creation** (`inquiry_creation`)
**API Endpoint:** `POST /api/inquiries` (if exists)  
**Triggered When:** Brand creates an inquiry for a property

**Payload Structure:**
```json
{
  "formType": "inquiry_creation",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "lokazen_platform",
  "inquiryId": "inq-12345",
  "propertyId": "prop-12345",
  "brandId": "user-12345",
  "ownerId": "user-67890",
  "message": "Interested in this property",
  "brandName": "Coffee Shop",
  "brandEmail": "brand@example.com",
  "propertyTitle": "Retail Space in Indiranagar"
}
```

**Fields:**
- `inquiryId` (string, required): Inquiry ID
- `propertyId` (string, required): Property ID
- `brandId` (string, required): Brand user ID
- `ownerId` (string, required): Owner user ID
- `message` (string, required): Inquiry message
- `brandName` (string, optional): Brand name
- `brandEmail` (string, optional): Brand email
- `propertyTitle` (string, optional): Property title

---

## 🚀 Step-by-Step Pabbly Router Setup

### Step 1: Access Pabbly Connect
1. Log in to your Pabbly Connect account
2. Navigate to **Workflows**
3. Click **Create Workflow** or select your existing workflow

### Step 2: Add Webhook Trigger
1. Click **Add Step**
2. Search for **"Webhook"** or **"Webhook by Pabbly"**
3. Select **"Webhook by Pabbly"** as the trigger
4. Copy the webhook URL provided by Pabbly
5. **Important:** Replace it with our webhook URL:
   ```
   https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc
   ```

### Step 3: Add Router Step
1. After the webhook trigger, click **Add Step**
2. Search for **"Router"** or **"Conditional Router"**
3. Select **"Router"** or **"Conditional Router"**

### Step 4: Configure Router Conditions

Set up routing based on the `formType` field. Here's the recommended routing structure:

#### Router Configuration:

**Condition 1: Brand Lead Creation**
- **Condition:** `formType` equals `brand_lead_creation`
- **Action:** Route to CRM/Lead Management (e.g., Add to Google Sheets, Send to CRM)

**Condition 2: Owner Lead Creation**
- **Condition:** `formType` equals `owner_lead_creation`
- **Action:** Route to Owner Lead Management

**Condition 3: User Registration**
- **Condition:** `formType` equals `user_registration`
- **Action:** Route to User Management System

**Condition 4: Contact Team**
- **Condition:** `formType` equals `contact_team`
- **Action:** Route to Support/Contact Management

**Condition 5: Expert Connect**
- **Condition:** `formType` equals `expert_connect`
- **Action:** Route to Expert Assignment System

**Condition 6: Requirements Lead**
- **Condition:** `formType` equals `requirements_lead`
- **Action:** Route to Lead Management

**Condition 7: Property Submission**
- **Condition:** `formType` equals `property_submission`
- **Action:** Route to Property Management System

**Condition 8: Visit Schedule**
- **Condition:** `formType` equals `visit_schedule`
- **Action:** Route to Visit Scheduling System

**Condition 9: Inquiry Creation**
- **Condition:** `formType` equals `inquiry_creation`
- **Action:** Route to Inquiry Management System

**Default/Else Condition:**
- **Action:** Route to General Notifications or Logging

### Step 5: Configure Each Route Action

For each route, you can add actions like:

1. **Add to Google Sheets**
   - Map fields from webhook payload to spreadsheet columns
   - Create separate sheets for each form type if needed

2. **Send Email Notification**
   - Configure email templates for each form type
   - Include relevant fields in the email

3. **Add to CRM**
   - Connect to your CRM (HubSpot, Salesforce, etc.)
   - Map webhook fields to CRM fields

4. **Send WhatsApp/SMS**
   - Configure messaging for urgent leads
   - Use phone number from payload

5. **Create Task/Reminder**
   - Set up follow-up tasks based on form type
   - Assign to team members

### Step 6: Test the Integration

1. **Test Each Form Type:**
   - Submit each form type from the platform
   - Verify webhook data reaches Pabbly
   - Check router conditions are working
   - Verify actions are triggered correctly

2. **Monitor Logs:**
   - Check Pabbly execution logs
   - Verify data mapping is correct
   - Check for any errors

### Step 7: Set Up Error Handling

1. Add **Error Handler** step after router
2. Configure notifications for failed webhooks
3. Set up retry logic if needed

---

## 📊 Recommended Pabbly Workflow Structure

```
┌─────────────────┐
│  Webhook Trigger│
│  (All Forms)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Router      │
│  (formType)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    │         │          │          │          │
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Brand  │ │ Owner  │ │Contact│ │Expert │ │Property│
│ Leads  │ │ Leads  │ │ Team  │ │Connect│ │Submit  │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │         │          │          │          │
    └─────────┴──────────┴──────────┴──────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Google Sheets│
            │  / CRM / Email│
            └───────────────┘
```

---

## 🔧 Integration Code Updates

The webhook integration is already implemented in the codebase. To add webhooks to additional endpoints:

1. Import the webhook function:
   ```typescript
   import { sendXXXWebhook } from '@/lib/pabbly-webhook'
   ```

2. Call the webhook after successful form submission:
   ```typescript
   await sendXXXWebhook({
     // ... form data
   }).catch(err => console.warn('Webhook failed:', err))
   ```

---

## 📝 Notes

- All webhook calls are non-blocking (failures won't break the main flow)
- Timestamps are in ISO 8601 format
- All form types include `formType`, `timestamp`, and `source` fields
- Optional fields may be `null` or `undefined`
- Arrays may be empty `[]`
- Numbers may be `null` if not provided

---

## 🆘 Troubleshooting

1. **Webhook not receiving data:**
   - Verify webhook URL is correct
   - Check environment variable `PABBLY_WEBHOOK_URL`
   - Check server logs for webhook errors

2. **Router not working:**
   - Verify `formType` field is present in payload
   - Check condition syntax in Pabbly
   - Test with sample payload

3. **Data mapping issues:**
   - Verify field names match exactly
   - Check for null/undefined values
   - Use Pabbly's data mapper tool

---

## 📞 Support

For issues or questions:
- Check server logs: `[Pabbly Webhook]` prefix
- Verify webhook URL in environment variables
- Test webhook manually using curl or Postman
