# Entity Relationship (ER) Diagram

The following Mermaid diagram represents the relational schema and relationships in the **Campus Infrastructure Intelligence** database.

```mermaid
erDiagram
    Role ||--o{ User : "assigns"
    User ||--o{ IssueReport : "reports"
    User ||--o{ MaintenanceTask : "assigned_tech"
    User ||--o{ Notification : "receives"
    User ||--o{ Vendor : "vendor_profile"
    User ||--o{ LostFoundItem : "reports_item"

    Building ||--o{ Floor : "contains"
    Floor ||--o{ Room : "contains"

    Building ||--o{ Asset : "located_in"
    Room ||--o{ Asset : "located_in"
    AssetCategory ||--o{ Asset : "categorizes"
    Asset ||--o{ AssetMaintenanceLog : "logs"
    Asset ||--o{ AIPrediction : "predicts"

    Building ||--o{ IssueReport : "occurs_in"
    Room ||--o{ IssueReport : "occurs_in"
    Asset ||--o{ IssueReport : "pertains_to"
    IssueCategory ||--o{ IssueReport : "classified_as"

    IssueReport ||--o| MaintenanceTask : "generates"
    MaintenanceTask ||--o{ VendorAssignment : "dispatches"
    Vendor ||--o{ VendorAssignment : "handles"

    Building ||--o{ LostFoundItem : "found_at"
    LostFoundItem ||--o{ LostFoundMatch : "lost_item"
    LostFoundItem ||--o{ LostFoundMatch : "found_item"
```

---

## Relationship Summary

1. **User & Role**: Each `User` belongs to one `Role` (`ADMIN`, `TECHNICIAN`, `STUDENT`, `FACULTY`, `VENDOR`).
2. **Building Hierarchy**: `Building` (1) -> `Floor` (N) -> `Room` (N).
3. **Assets**: Belong to a `Building`, `Room`, and `AssetCategory`.
4. **Issue Reports**: Filed by a `User` against a `Building`, `Room`, and optional `Asset`.
5. **Maintenance Tasks**: Generated from an `IssueReport` and assigned to a `User` (`TECHNICIAN`) or `Vendor`.
6. **Lost & Found**: `LostFoundItem` records linked to users, buildings, and paired via `LostFoundMatch`.
