# UUID Sanitization Utility

This utility provides defensive null-coercion for UUID fields to prevent "invalid input syntax for type uuid" errors in PostgreSQL/Supabase.

## Problem

PostgreSQL expects UUID fields to be either:
- A valid UUID string
- `null` (for optional fields)
- **NOT** `undefined` or empty strings

When JavaScript `undefined` values are sent to the database, they get converted to empty strings `""`, which are invalid UUID syntax and cause database errors.

## Solution

The `uuidSanitizer.ts` utility provides several functions to automatically sanitize UUID fields:

### 1. Basic Sanitization

```typescript
import { sanitizeUuidFields } from '../utils/uuidSanitizer';

// Before sending data to database
const sanitizedData = sanitizeUuidFields({
  id: 'valid-uuid-here',
  profile_id: undefined,        // Will become null
  tenant_id: '',               // Will become null
  client_id: 'another-uuid',
  name: 'John Doe'             // Non-UUID fields unchanged
});
```

### 2. Service-Level Sanitization

```typescript
// In your service methods
static async createClient(clientData: any) {
  const sanitizedData = sanitizeUuidFields(clientData);
  
  const { data, error } = await supabase
    .from('clients')
    .insert(sanitizedData)
    .select()
    .single();
}
```

### 3. Higher-Order Function Wrapper

```typescript
import { withUuidSanitization } from '../utils/uuidSanitizer';

// Wrap any async function with UUID sanitization
const safeCreateClient = withUuidSanitization(createClient);
```

### 4. Query Builder Helper

```typescript
import { createSanitizedQueryBuilder } from '../utils/uuidSanitizer';

const clientQueries = createSanitizedQueryBuilder(supabase, 'clients');

// All operations automatically sanitized
await clientQueries.insert(clientData);
await clientQueries.update(updateData);
await clientQueries.upsert(upsertData);
```

## UUID Fields Covered

The utility automatically sanitizes these common UUID fields:
- `id`
- `client_id`
- `tenant_id`
- `profile_id`
- `user_id`
- `loan_id`
- `application_id`
- `guarantor_id`
- `collateral_id`
- `document_id`
- `group_id`
- `member_id`
- `created_by`
- `updated_by`
- `verified_by`
- `uploaded_by`

## Custom UUID Fields

You can specify additional UUID fields:

```typescript
const sanitized = sanitizeUuidFields(data, ['custom_uuid_field', 'another_uuid']);
```

## Validation Functions

```typescript
import { isValidUuid, toSafeUuid } from '../utils/uuidSanitizer';

// Check if a string is a valid UUID
if (isValidUuid(someValue)) {
  // Safe to use
}

// Convert any value to a safe UUID (valid UUID or null)
const safeUuid = toSafeUuid(someValue);
```

## Implementation Examples

### Client Service
```typescript
// Before
const { data, error } = await supabase
  .from('clients')
  .insert(clientData);

// After
const { data, error } = await supabase
  .from('clients')
  .insert(sanitizeUuidFields(clientData));
```

### Loan Service
```typescript
// Before
const { data, error } = await supabase
  .from('loan_applications')
  .insert({
    client_id: applicationData.client_id,
    loan_product_id: applicationData.loan_product_id,
    // ... other fields
  });

// After
const { data, error } = await supabase
  .from('loan_applications')
  .insert(sanitizeUuidFields({
    client_id: applicationData.client_id,
    loan_product_id: applicationData.loan_product_id,
    // ... other fields
  }));
```

## Best Practices

1. **Always sanitize before database operations** - Apply `sanitizeUuidFields()` to any data being inserted or updated
2. **Use at service level** - Sanitize in your service methods rather than in components
3. **Consistent application** - Apply to all database operations, not just client-related ones
4. **Test edge cases** - Test with `undefined`, `null`, empty strings, and invalid UUIDs
5. **Monitor logs** - The utility logs sanitization actions for debugging

## Migration Guide

To add UUID sanitization to existing services:

1. Import the utility:
   ```typescript
   import { sanitizeUuidFields } from '../utils/uuidSanitizer';
   ```

2. Wrap data before database operations:
   ```typescript
   // Before
   .insert(data)
   
   // After
   .insert(sanitizeUuidFields(data))
   ```

3. Test thoroughly with various data scenarios

## Error Prevention

This utility prevents these common errors:
- `invalid input syntax for type uuid: ""`
- `invalid input syntax for type uuid: "undefined"`
- `invalid input syntax for type uuid: "null"`

By ensuring all UUID fields are either valid UUIDs or `null` before reaching the database.

















