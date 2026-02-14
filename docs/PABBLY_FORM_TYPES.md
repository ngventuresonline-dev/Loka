# Pabbly Form Types - Quick Reference

This document lists all form types available in the Lokazen platform for Pabbly router configuration.

## Webhook URL
```
https://connect.pabbly.com/workflow/sendwebhookdata/IjU3NjcwNTZjMDYzNjA0MzI1MjZlNTUzMDUxMzAi_pc
```

---

## Form Types Summary

| # | Form Type | formType Value | API Endpoint | Description |
|---|-----------|----------------|-------------|-------------|
| 1 | Brand Lead Creation | `brand_lead_creation` | `POST /api/leads/create` | Brand completes onboarding/search flow |
| 2 | Owner Lead Creation | `owner_lead_creation` | `POST /api/leads/owner` | Owner submits initial information |
| 3 | Contact Team | `contact_team` | `POST /api/contact-team` | User submits "Contact Team" form |
| 4 | Expert Connect | `expert_connect` | `POST /api/expert/connect` | Brand requests to connect with expert |
| 5 | Requirements Lead | `requirements_lead` | `POST /api/leads/requirements` | User submits requirements form |
| 6 | Property Submission | `property_submission` | `POST /api/owner/property` | Owner submits new property listing |
| 7 | Visit Schedule | `visit_schedule` | `POST /api/visits/schedule` | Brand schedules property visit |
| 8 | Inquiry Creation | `inquiry_creation` | `POST /api/inquiries` | Brand creates inquiry for property |

---

## Router Configuration Example

In Pabbly Connect, set up router conditions based on the `formType` field:

### Condition 1: Brand Leads
- **Field:** `formType`
- **Operator:** equals
- **Value:** `brand_lead_creation`

### Condition 2: Owner Leads
- **Field:** `formType`
- **Operator:** equals
- **Value:** `owner_lead_creation`

### Condition 3: Contact Team
- **Field:** `formType`
- **Operator:** equals
- **Value:** `contact_team`

### Condition 4: Expert Connect
- **Field:** `formType`
- **Operator:** equals
- **Value:** `expert_connect`

### Condition 5: Requirements Lead
- **Field:** `formType`
- **Operator:** equals
- **Value:** `requirements_lead`

### Condition 6: Property Submission
- **Field:** `formType`
- **Operator:** equals
- **Value:** `property_submission`

### Condition 7: Visit Schedule
- **Field:** `formType`
- **Operator:** equals
- **Value:** `visit_schedule`

### Condition 8: Inquiry Creation
- **Field:** `formType`
- **Operator:** equals
- **Value:** `inquiry_creation`

---

## Common Payload Fields

All webhook payloads include:
- `formType` (string): The form type identifier
- `timestamp` (string): ISO 8601 timestamp
- `source` (string): Always "lokazen_platform"

---

## Field Mapping Guide

### Brand Lead Creation Fields
```
name, email, phone, businessType, locations[], budgetMin, budgetMax, sizeMin, sizeMax
```

### Owner Lead Creation Fields
```
name, email, phone
```

### Contact Team Fields
```
name, phone, bestTime, additionalRequirements, searchCriteria{}
```

### Expert Connect Fields
```
propertyId, brandName, email, phone, scheduleDateTime, notes
```

### Requirements Lead Fields
```
name, phone, email, requirements, searchCriteria{}, source
```

### Property Submission Fields
```
ownerId, propertyId, propertyType, location, size, rent, deposit, amenities[], ownerName, ownerEmail, ownerPhone
```

### Visit Schedule Fields
```
propertyId, dateTime, note, name, email, phone, company
```

### Inquiry Creation Fields
```
inquiryId, propertyId, brandId, ownerId, message, brandName, brandEmail, propertyTitle
```

---

## Notes

- All webhook calls are non-blocking (failures won't break the main flow)
- Optional fields may be `null`, `undefined`, or missing
- Arrays may be empty `[]`
- Numbers may be `null` if not provided
- Check server logs with `[Pabbly Webhook]` prefix for debugging

---

For detailed payload structures and setup instructions, see `PABBLY_INTEGRATION_GUIDE.md`.
