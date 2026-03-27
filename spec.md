# FoodSave - NGO Food Donation Feature

## Current State
The app has a food waste tracker with:
- Waste entry logging (add/delete)
- Stats dashboard
- Tips section
- About page
- User authentication via Internet Identity
- Backend: Motoko with waste entries, tips, stats, user profiles

## Requested Changes (Diff)

### Add
- **Donate Food** form: Users can list surplus food available for NGO pickup (food name, quantity, location, pickup window, contact info)
- **NGO Portal tab**: NGOs can browse available food donations and claim them
- **Status tracker**: Each donation goes through Available → Claimed → Collected
- New backend types: FoodDonation with fields (id, foodName, quantity, location, pickupWindow, contact, status, donor, claimedBy, timestamp)
- Backend endpoints: addFoodDonation, getAvailableDonations, getAllDonations, claimDonation, markCollected, getMyDonations
- New nav tab "Donate" in section tabs

### Modify
- App.tsx: Add donate section tab, donation form, NGO portal view
- Backend main.mo: Add FoodDonation type and related functions

### Remove
- Nothing removed

## Implementation Plan
1. Update backend with FoodDonation type and CRUD + status functions
2. Update frontend backend.d.ts bindings
3. Add Donate tab to the frontend with:
   - Donate Food form (for donors)
   - Available Donations list (for NGOs to claim)
   - My Donations list with status tracking
