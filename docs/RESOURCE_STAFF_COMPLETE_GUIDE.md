# Resource & Staff Management - Complete Implementation Guide

## 📚 Documentation Index

This feature has been fully documented across multiple files. Here's your roadmap:

### 1. **Main Implementation Guide** 
📄 `approach/resource-staff-implementation-guide.md`

**What's Inside**:
- Complete architecture explanation
- Database schema design with rationale
- Backend API implementation (step-by-step)
- Frontend implementation (React Native)
- Integration flows
- Common pitfalls and solutions
- Performance considerations
- Testing strategies

**Best For**: Understanding the complete implementation from database to UI

---

### 2. **Architecture Diagrams**
📄 `docs/resource-staff-architecture.md`

**What's Inside**:
- System architecture diagram
- Data flow diagrams
- Component interaction maps
- Database relationship diagrams
- Auto-assignment algorithm flowchart
- Type safety flow visualization

**Best For**: Visual learners who want to see how components connect

---

### 3. **API Testing Guide**
📄 `curl-test/README-RESOURCE-STAFF.md`  
📄 `curl-test/resource-staff-api-tests.sh`

**What's Inside**:
- Complete cURL test suite (27 test cases)
- Individual command examples
- Expected responses
- Error scenarios
- Testing workflow
- Troubleshooting tips

**Best For**: Testing the API endpoints and understanding request/response formats

---

### 4. **Original Implementation Summary**
📄 `RESOURCE_STAFF_IMPLEMENTATION_SUMMARY.md`

**What's Inside**:
- Quick overview of what was built
- File structure
- Key features
- Integration points

**Best For**: Quick reference of what files were created

---

## 🚀 Quick Start Guide

### For Junior Developers

**Step 1: Understand the Problem**
- Read the "Overview" section in `approach/resource-staff-implementation-guide.md`
- Look at the architecture diagrams in `docs/resource-staff-architecture.md`

**Step 2: Understand the Database**
- Read "Database Schema Design" section
- Understand why we added Resource, Staff, and ResourceStaffLink tables
- Look at the database relationship diagram

**Step 3: Understand the Backend**
- Read "Backend API Implementation" section
- Follow the service → controller → route pattern
- Understand the auto-assignment algorithm

**Step 4: Test the API**
- Follow `curl-test/README-RESOURCE-STAFF.md`
- Run the test script: `./curl-test/resource-staff-api-tests.sh`
- Try individual commands

**Step 5: Understand the Frontend**
- Read "Frontend Implementation" section
- Understand the service → store → screen pattern
- Look at component examples

**Step 6: See It All Together**
- Read "Integration Flow" section
- Follow a complete booking from WhatsApp to database
- Understand how all pieces connect

---

## 📖 Learning Path

### Beginner Level
1. Read the Overview and Architecture Context
2. Understand the database schema
3. Run the cURL tests
4. Look at the architecture diagrams

### Intermediate Level
1. Read the service layer implementation
2. Understand the auto-assignment algorithm
3. Study the race condition prevention
4. Review the frontend components

### Advanced Level
1. Study the transaction patterns
2. Understand the utilization calculations
3. Review performance optimizations
4. Explore future enhancements

---

## 🔑 Key Concepts Explained

### 1. Why Resources and Staff?

**Problem**: Salons have physical constraints
- Limited chairs/stations
- Limited staff members
- Need to prevent double-booking

**Solution**: Track both resources and staff
- Each booking gets assigned to a resource AND a staff member
- System prevents overbooking by checking availability
- Auto-assignment distributes workload evenly

### 2. Why Soft Delete?

**Problem**: Deleting resources breaks historical data
- Old bookings reference deleted resources
- Can't generate reports
- Lose audit trail

**Solution**: Use `isActive` flag
- Resources are never deleted, just deactivated
- Historical bookings remain intact
- Can reactivate if needed

### 3. Why Linked Pairs?

**Problem**: Staff have preferred stations
- Priya always works at Chair 3
- Rahul prefers the window seat
- Better service when staff use familiar equipment

**Solution**: ResourceStaffLink table
- Links staff to their preferred resources
- Auto-assignment prioritizes linked pairs
- Improves efficiency and service quality

### 4. Why Serializable Transactions?

**Problem**: Race conditions
- Two customers book same slot simultaneously
- Both see availability
- Both try to book
- Result: double booking!

**Solution**: Serializable isolation level
- Database locks rows during transaction
- Only one booking succeeds
- Other gets clear error message
- Prevents conflicts automatically

### 5. Why Utilization Metrics?

**Problem**: Can't see which resources are underused
- Chair 5 sits empty all day
- Priya is overworked
- No data to make decisions

**Solution**: Track utilization percentage
- Calculate booked minutes / total minutes
- Show in dashboard
- Helps with capacity planning

---

## 🎯 Common Use Cases

### Use Case 1: Onboarding a New Salon

```
1. Merchant downloads app
2. Completes phone verification
3. Enters business details
4. Onboarding wizard starts:
   - "How many chairs do you have?" → Creates 5 resources
   - "Add your staff" → Creates 3 staff members
   - "Link staff to chairs" → Creates ResourceStaffLinks
5. Setup complete!
```

**API Calls**:
```bash
POST /v1/businesses/:id/resources/bulk { count: 5 }
POST /v1/businesses/:id/staff { name: "Priya" }
POST /v1/businesses/:id/staff/:id/link-resource { resourceId: "..." }
```

### Use Case 2: Customer Books via WhatsApp

```
1. Customer: "Book haircut at 2pm"
2. Backend checks availability
3. Finds: Chair 3 and Priya are available
4. Auto-assigns based on:
   - Priya is linked to Chair 3 (preferred pair)
   - Both have low utilization
5. Creates booking with assignment
6. Sends confirmation: "Booked! Chair 3 with Priya at 2pm"
```

**API Calls**:
```bash
POST /v1/businesses/:id/availability/check
POST /v1/businesses/:id/bookings (with auto-assignment)
```

### Use Case 3: Merchant Creates Manual Booking

```
1. Merchant opens app
2. Taps "New Booking"
3. Selects customer and service
4. Picks time slot
5. App shows available resources and staff
6. Merchant can:
   - Accept suggested assignment (one tap)
   - Manually select resource and staff
7. Booking created
```

**API Calls**:
```bash
POST /v1/businesses/:id/availability/check
POST /v1/businesses/:id/bookings { resourceId, staffId }
```

### Use Case 4: Viewing Dashboard

```
1. Merchant opens dashboard
2. Sees capacity status:
   - 5 active resources
   - 3 active staff
   - Effective capacity: 3
   - Warning: "Staff shortage"
3. Sees utilization:
   - Chair 1: 85% (busy)
   - Chair 2: 45% (underused)
   - Priya: 90% (overworked)
4. Makes decision: Hire more staff
```

**API Calls**:
```bash
GET /v1/businesses/:id/resources (with stats)
GET /v1/businesses/:id/staff (with stats)
GET /v1/businesses/:id/availability/capacity
```

---

## 🛠️ Development Workflow

### Making Changes to the Feature

#### Adding a New Field to Resource

1. **Update Prisma Schema**
```prisma
model Resource {
  // ... existing fields
  color String? // NEW FIELD
}
```

2. **Run Migration**
```bash
cd packages/shared-types
pnpm db:push
pnpm db:generate
```

3. **Update Zod Schema**
```typescript
export const createResourceSchema = z.object({
  // ... existing fields
  color: z.string().optional(),
});
```

4. **Update Service**
```typescript
async create(data: CreateResourceInput) {
  return prisma.resource.create({
    data: {
      // ... existing fields
      color: data.color,
    },
  });
}
```

5. **Update Frontend**
```typescript
// Add color picker to form
<ColorPicker
  value={color}
  onChange={setColor}
/>
```

6. **Test**
```bash
# Test API
curl -X POST .../resources -d '{"name":"Chair 1","color":"#FF0000"}'

# Test frontend
# Open app, create resource, verify color is saved
```

#### Adding a New Endpoint

1. **Add Route**
```typescript
router.get('/:id/stats', resourceController.getStats);
```

2. **Add Controller Method**
```typescript
async getStats(req, res, next) {
  const stats = await resourceService.getStats(req.params.id);
  res.json({ success: true, data: stats });
}
```

3. **Add Service Method**
```typescript
async getStats(resourceId: string) {
  // Calculate stats
  return { ... };
}
```

4. **Add Frontend Service Method**
```typescript
async getStats(resourceId: string) {
  const response = await apiClient.get(`/resources/${resourceId}/stats`);
  return response.data.data;
}
```

5. **Test with cURL**
```bash
curl -X GET .../resources/:id/stats
```

---

## 🐛 Debugging Guide

### Issue: "Resource not found"

**Possible Causes**:
1. Wrong resource ID
2. Resource belongs to different business
3. User doesn't own the business

**How to Debug**:
```bash
# Check if resource exists
curl -X GET .../resources/:id

# Check business ownership
curl -X GET .../businesses/:id

# Check server logs
tail -f apps/api/logs/app.log
```

### Issue: "Cannot deactivate resource"

**Cause**: Resource has active bookings

**How to Fix**:
```bash
# List active bookings for resource
curl -X GET .../bookings?resourceId=:id&status=CONFIRMED

# Reassign or complete bookings first
curl -X PATCH .../bookings/:id/reassign -d '{"resourceId":"..."}'

# Then deactivate
curl -X POST .../resources/:id/deactivate
```

### Issue: "Slot not available" (but it looks available)

**Possible Causes**:
1. Race condition (someone just booked it)
2. Time zone mismatch
3. Booking overlaps by 1 minute

**How to Debug**:
```bash
# Check exact bookings in time slot
curl -X GET .../bookings?scheduledAt=...&endAt=...

# Check with wider time range
curl -X POST .../availability/check -d '{
  "scheduledAt": "2026-01-10T13:55:00Z",
  "endAt": "2026-01-10T15:05:00Z"
}'
```

---

## 📊 Monitoring Checklist

### What to Monitor in Production

1. **Capacity Metrics**
   - Average utilization per resource
   - Average utilization per staff
   - Effective capacity over time
   - Warning frequency

2. **Performance Metrics**
   - API response times (should be < 200ms)
   - Database query times
   - Transaction success rate
   - Error rates

3. **Business Metrics**
   - Bookings per day
   - Most used resources
   - Most requested staff
   - Peak booking times

4. **Error Tracking**
   - Failed bookings
   - Race condition conflicts
   - Deactivation attempts with active bookings
   - Duplicate name errors

---

## 🎓 Additional Resources

### Related Documentation
- [Booking System Guide](approach/booking-system-guide.md)
- [Backend Migration Guide](approach/backend-migration-guide.md)
- [Business Management Guide](approach/business-management-guide.md)

### External Resources
- [Prisma Documentation](https://www.prisma.io/docs)
- [Zod Documentation](https://zod.dev)
- [Express.js Guide](https://expressjs.com)
- [React Native Docs](https://reactnative.dev)
- [Zustand Docs](https://docs.pmnd.rs/zustand)

### Database Concepts
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html)

---

## 🤝 Contributing

### Before Making Changes

1. Read the relevant documentation
2. Understand the existing patterns
3. Check for similar implementations
4. Write tests first (TDD)
5. Update documentation

### Code Review Checklist

- [ ] Follows existing patterns
- [ ] Has proper error handling
- [ ] Includes validation
- [ ] Has tests
- [ ] Updates documentation
- [ ] No breaking changes
- [ ] Performance considered

---

## 📞 Getting Help

### Questions About...

**Database Schema**: Read "Database Schema Design" section  
**API Endpoints**: Check cURL test examples  
**Frontend Components**: Review "Frontend Implementation" section  
**Auto-Assignment**: Study the algorithm flowchart  
**Race Conditions**: Read transaction pattern section  
**Performance**: Check "Performance Considerations" section

### Still Stuck?

1. Check the architecture diagrams
2. Run the cURL tests
3. Look at the code examples
4. Review the common pitfalls section
5. Ask a senior developer

---

## ✅ Implementation Checklist

### Backend Complete
- [x] Database schema (Resource, Staff, ResourceStaffLink)
- [x] Zod validation schemas
- [x] Service layer (CRUD + business logic)
- [x] Controllers (HTTP handling)
- [x] Routes (REST endpoints)
- [x] Auto-assignment service
- [x] Availability service
- [x] Race condition prevention
- [x] Error handling
- [x] Logging

### Frontend Complete
- [x] API service layer
- [x] Zustand stores
- [x] Management screens
- [x] Onboarding wizard
- [x] Booking components
- [x] Capacity dashboard
- [x] Type safety
- [x] Error handling

### Documentation Complete
- [x] Implementation guide
- [x] Architecture diagrams
- [x] API testing guide
- [x] cURL test suite
- [x] This complete guide

### Testing Complete
- [x] API endpoints tested
- [x] Frontend components tested
- [x] Integration flow verified
- [x] Error scenarios tested

---

**Document Version**: 1.0  
**Last Updated**: January 9, 2026  
**Maintained By**: Salex Development Team  
**Status**: ✅ Production Ready

---

## 🎉 Congratulations!

You now have complete documentation for the Resource & Staff Management feature. Whether you're a junior developer learning the system or a senior developer making changes, these guides have you covered.

**Happy Coding! 🚀**
