# Audit Logs Frontend - User Guide

## ✅ FRONTEND IMPLEMENTATION COMPLETE!

The audit log viewing interface has been added to your warehouse system. You can now view and investigate all inventory changes directly from the web interface.

---

## 🎯 How to Access Audit Logs

### **Direct URL**:
```
http://your-domain/warehouse/audit-logs
```

### **From Navigation**:
1. Login to your warehouse account
2. Go to: **Warehouse** → **Audit Logs**

**Access**: Only users with `WAREHOUSE_ADMIN` or `SUPER_ADMIN` roles can access audit logs.

---

## 📱 User Interface Features

### **Tab 1: Inventory Changes**

View all inventory modifications with detailed information:

**Filters Available**:
- **Trigger Type**: Filter by how the change happened
  - All
  - Manual Adjustment
  - Sale
  - Purchase Update
  - Purchase Delete
  - Sale Delete
- **Date Range**: Start date and end date
- **Apply Filters**: Click to apply your filter selections

**Table Columns**:
1. **Date/Time** - When the change occurred
2. **Product** - Product name
3. **User** - Who made the change (username and role)
4. **Trigger** - How it was triggered (color-coded chip)
5. **Changes** - Expandable accordion showing:
   - Packs: Old → New (Difference)
   - Pallets: Old → New (Difference)
   - Units: Old → New (Difference)
6. **Reason** - Why the change was made

**Color Coding**:
- 🟠 **Orange** (Warning) - Manual Adjustment
- 🟢 **Green** (Success) - Sale
- 🔵 **Blue** (Info) - Purchase Update
- 🔴 **Red** (Error) - Purchase/Sale Delete

**Pagination**: 20 records per page

---

### **Tab 2: Suspicious Activities**

Automatically detects and highlights unusual inventory changes:

**Time Period Filter**:
- Last 7 days
- Last 14 days
- Last 30 days (default)
- Last 60 days
- Last 90 days

**Summary Alert**:
Shows total suspicious activities found:
- Total count
- **HIGH severity** (red) - Multiple red flags
- **MEDIUM severity** (orange) - Single red flag

**Activity Cards**:

Each suspicious activity is displayed in a card with:

1. **Header**:
   - Product name
   - Date/time of change
   - Severity badge (HIGH/MEDIUM)

2. **Details**:
   - **User**: Who made the change
   - **Trigger**: How it happened
   - **Reason**: Why it was done
   - **Red Flags**: List of suspicious indicators
   - **Changes**: Inventory differences

**Red Flags Detected**:
- ❌ Direct manual inventory adjustment
- ❌ Large reduction (>50 packs or >10 pallets)
- ❌ Purchase record deleted
- ❌ Sale record deleted
- ❌ No reason provided for manual adjustment

**Card Border Color**:
- 🔴 **Red border** - HIGH severity
- 🟠 **Orange border** - MEDIUM severity

---

## 🔍 How to Investigate "Sosa 1 Ltr" Stock Loss

### **Step 1: Go to Audit Logs Page**
Navigate to: `/warehouse/audit-logs`

### **Step 2: Check Suspicious Activities Tab**
1. Click on **"Suspicious Activities"** tab
2. Set time period to **"Last 30 days"**
3. Look for cards showing "Sosa 1 Ltr"

### **Step 3: Review Inventory Changes Tab**
1. Click on **"Inventory Changes"** tab
2. Set filters:
   - **Trigger Type**: "Manual Adjustment" (to find direct changes)
   - **Start Date**: 30 days ago
   - **End Date**: Today
3. Click **"Apply Filters"**
4. Scroll through the list to find "Sosa 1 Ltr" entries

### **Step 4: Analyze the Results**
For each entry, check:
- **Who**: Which user made the change?
- **When**: What date and time?
- **How**: Manual adjustment? Purchase delete? Sale delete?
- **Changes**: How much stock was reduced?
- **Reason**: What reason was provided (if any)?

---

## 📊 Reading the Changes

### **Change Format**:
Each change shows as a chip with format:
```
Old → New (Difference)
```

**Examples**:

**Stock Decrease** (Red chip):
```
100 → 50 (-50)
```
- Started with 100 packs
- Now has 50 packs
- Lost 50 packs

**Stock Increase** (Green chip):
```
50 → 100 (+50)
```
- Started with 50 packs
- Now has 100 packs
- Gained 50 packs

**No Change** (Gray chip):
```
100 → 100 (0)
```
- No change in this unit type

---

## 🚨 Understanding Severity Levels

### **HIGH Severity** (Red Badge)
Multiple red flags detected. Requires immediate investigation.

**Example**:
- Manual adjustment
- Large reduction (-75 packs)
- No reason provided

**Action**: Contact the user immediately to verify the change.

---

### **MEDIUM Severity** (Orange Badge)
Single red flag detected. Worth reviewing.

**Example**:
- Purchase deleted
- -30 packs reduced

**Action**: Review the reason and verify if it was legitimate.

---

## 🎨 Visual Guide

### **Trigger Type Colors**:
| Trigger | Color | Meaning |
|---------|-------|---------|
| Manual Adjustment | Orange | Admin directly changed inventory |
| Sale | Green | Normal sale transaction |
| Purchase Update | Blue | Purchase quantity was edited |
| Purchase Delete | Red | Purchase record was deleted |
| Sale Delete | Red | Sale was reversed/deleted |

### **Change Colors**:
| Type | Color | Indicator |
|------|-------|-----------|
| Decrease | Red | Stock went down |
| Increase | Green | Stock went up |
| No Change | Gray | No modification |

### **Severity Colors**:
| Level | Color | Badge |
|-------|-------|-------|
| HIGH | Red | Urgent |
| MEDIUM | Orange | Review |

---

## 🔄 Refresh Data

Click the **"Refresh"** button (top right) to reload the latest audit logs from the server.

---

## 📁 Files Created/Modified

### **New Files**:
1. ✅ `/src/services/auditLogService.ts` - API service for audit logs
2. ✅ `/src/pages/warehouse/AuditLogs.tsx` - Main audit logs page component

### **Modified Files**:
1. ✅ `/src/pages/warehouse/WarehouseRoutes.tsx` - Added audit logs route

---

## 🎯 Next Steps

### **1. Restart Frontend** (if needed):
```bash
cd "/Users/MAC/Desktop/premium g/premium-g-frontend"
npm start
```

### **2. Login with Admin Account**:
- Use `WAREHOUSE_ADMIN` or `SUPER_ADMIN` account

### **3. Navigate to Audit Logs**:
```
http://localhost:3000/warehouse/audit-logs
```

### **4. Investigate Stock Loss**:
1. Check **Suspicious Activities** tab first
2. Review **Inventory Changes** for "Sosa 1 Ltr"
3. Filter by **"Manual Adjustment"** to find direct changes
4. Note down: WHO, WHEN, and WHY

### **5. Take Action**:
- If you find unauthorized changes, talk to the user
- If it's a system issue, report the findings
- If it's legitimate, add proper documentation/reason

---

## 🛠️ Technical Details

### **Component Structure**:
```
AuditLogs
├── Tabs (2)
│   ├── Tab 1: Inventory Changes
│   │   ├── Filters (Trigger, Date Range)
│   │   ├── Table with pagination
│   │   └── Expandable change details
│   └── Tab 2: Suspicious Activities
│       ├── Time period filter
│       ├── Summary alert
│       └── Activity cards
├── Refresh button
└── Error handling
```

### **API Integration**:
- Uses `auditLogService` for all API calls
- Automatic pagination (20 items per page)
- Real-time filtering
- Error handling with user-friendly messages

### **TypeScript Types**:
All audit log data is fully typed:
- `AuditLog` - Base audit log entry
- `InventoryChangeLog` - Inventory-specific log with metadata
- `SuspiciousActivity` - Flagged activities
- Filter interfaces for type-safe queries

---

## 📞 Troubleshooting

### **Issue**: Cannot access Audit Logs page
**Solution**: Ensure your user has `WAREHOUSE_ADMIN` or `SUPER_ADMIN` role

### **Issue**: "Failed to load" error
**Solutions**:
1. Check backend server is running
2. Verify API endpoint: `/api/v1/audit-logs`
3. Check browser console for errors
4. Verify authentication token is valid

### **Issue**: No data showing
**Solutions**:
1. Click **Refresh** button
2. Check date filters (expand date range)
3. Remove all filters and search again
4. Verify audit logging is enabled in backend

### **Issue**: Page is slow/laggy
**Solutions**:
1. Reduce date range (search smaller periods)
2. Use filters to limit results
3. Check network connection
4. Backend may need optimization if >10,000 logs

---

## ✨ Features Summary

✅ **Two-tab interface**: Inventory Changes + Suspicious Activities
✅ **Advanced filtering**: By trigger type, date range, time period
✅ **Color-coded indicators**: Easy visual identification
✅ **Expandable details**: Click to see full change breakdown
✅ **Pagination**: Handle thousands of records
✅ **Auto-detection**: System flags suspicious patterns
✅ **Severity levels**: HIGH/MEDIUM priority classification
✅ **Real-time refresh**: Get latest data on demand
✅ **Responsive design**: Works on desktop and tablet
✅ **Type-safe**: Full TypeScript support

---

## 🎉 Success!

You can now:
- ✅ View every inventory change ever made
- ✅ See WHO made changes and WHEN
- ✅ Understand WHY changes happened
- ✅ Detect suspicious patterns automatically
- ✅ Investigate stock losses effectively
- ✅ Hold users accountable for their actions

**Stock can no longer disappear without a trace!**
