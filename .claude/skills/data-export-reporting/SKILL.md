---
name: data-export-reporting
description: Generate professional reports and data exports in multiple formats (Excel, PDF, PowerPoint). Create payroll reports, attendance summaries, employee records, and HR analytics with proper formatting and data aggregation.
license: Complete terms in LICENSE.txt
---

# Data Export & Reporting Skill

This skill enables creation of professional reports and data exports for HR systems. Generate Excel spreadsheets with payroll data, attendance reports, PDF documents with formatted content, and PowerPoint presentations for HR analytics.

## Key Capabilities

### Excel (XLSX) Generation
- **Payroll Reports**: Salary slips, deductions, net pay calculations
- **Attendance Summaries**: Monthly/quarterly attendance records, leave balances
- **Employee Records**: Employee directory, department listings, contact information
- **Analytics**: Charts, pivot tables, KPI dashboards
- **Bulk Data**: Import/export employee data with validation

### PDF Generation
- **Official Documents**: Offer letters, employment contracts, appointment letters
- **Payslips**: Secure payroll statements with employee-specific data
- **Certificates**: Service certificates, experience letters
- **Reports**: Formatted HR reports with headers, footers, page numbers

### PowerPoint Generation
- **HR Dashboards**: KPI visualizations, headcount trends
- **Presentation Decks**: Training materials, policy presentations
- **Analytics Reports**: Charts, graphs, trend analysis

## Best Practices for HR Data

### Data Security
- Never expose sensitive data in exports unnecessarily
- Encrypt PDFs containing salary information
- Include watermarks on confidential documents
- Add audit trails for who exported what data and when

### Formatting Standards
- Use consistent headers: Employee ID, Name, Department, etc.
- Include report generation date and reporting period
- Add company branding (logos, colors) to documents
- Use currency formatting for financial data
- Apply proper date formatting (DD-MM-YYYY or MM/DD/YYYY based on locale)

### Data Aggregation
- Calculate running totals for payroll/attendance
- Use formulas in Excel for automatic calculations
- Group data by department, team, or role
- Include summary statistics (totals, averages, counts)
- Provide drill-down capability from summary to detail

### File Naming Conventions
```
Format: {ReportType}_{Date}_{Department}.xlsx
Examples:
- Payroll_2024-04_Accounting.xlsx
- Attendance_March2024_Engineering.xlsx
- EmployeeDirectory_2024-04-19.xlsx
```

## Implementation Patterns

### Payroll Report Pattern
1. Fetch employee data with salary information
2. Calculate deductions and net pay
3. Group by department or cost center
4. Create Excel with multiple sheets (summary, detail, calculations)
5. Add conditional formatting for outliers
6. Include footer with totals and verification checksums

### Attendance Report Pattern
1. Query attendance records for date range
2. Calculate present/absent/leave days
3. Identify patterns (late arrivals, early departures)
4. Create summary statistics
5. Export with visual indicators (color coding)
6. Include month-on-month comparison

### Employee Directory Pattern
1. Fetch employee master data
2. Include contact info, department, manager, hire date
3. Sort by department then name
4. Add filters for easy searching
5. Include headcount by department summary

## Common Challenges & Solutions

### Challenge: Large Datasets
**Solution**: 
- Split large reports into multiple sheets by department/date range
- Use pagination for exports exceeding 10,000 rows
- Implement batch export with progress tracking
- Consider CSV for raw data, Excel for formatted reports

### Challenge: Real-time Data Consistency
**Solution**:
- Export data at consistent times (end of day for payroll)
- Include data snapshot timestamp
- Verify exported data matches source records
- Maintain audit log of all exports

### Challenge: Performance with Calculations
**Solution**:
- Pre-calculate values in database queries
- Use database aggregations before exporting
- Minimize formula complexity in Excel sheets
- Cache calculation results for frequently generated reports

### Challenge: Regulatory Compliance
**Solution**:
- Include compliance metadata in reports
- Add authorization/approval fields
- Maintain export audit trail
- Include data retention information
- Add confidentiality notices

## Export Workflow

```
1. User requests report → Validate permissions
2. Fetch data from database → Apply filters/date ranges
3. Transform data → Group, sort, calculate
4. Generate file → Format, style, add formulas
5. Store file → Generate secure download link
6. Log export → Record who, what, when for audit
7. Clean up → Remove temporary files after download
```

## File Format Selection Guide

| Format | Best For | Advantages | Limitations |
|--------|----------|-----------|-------------|
| **Excel** | Detailed data, calculations, analysis | Formulas, charts, filtering, sorting | File size, compatibility |
| **PDF** | Official documents, payslips, contracts | Secure, consistent appearance, watermarking | Not editable, harder to analyze |
| **PowerPoint** | Executive presentations, dashboards | Visual impact, easy navigation, storytelling | Limited data capacity |
| **CSV** | Data import/export, integrations | Universal compatibility, small size | No formatting, no formulas |

## Security Considerations

- Validate user has permission to export requested data
- Encrypt sensitive files (PDF passwords, encrypted Excel)
- Remove personally identifiable info from shared reports
- Implement rate limiting on export requests
- Log all export activities with user and timestamp
- Set expiration on download links (24-48 hours)
- Sanitize filenames to prevent injection attacks
