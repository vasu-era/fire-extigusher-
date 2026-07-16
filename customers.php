<?php
// 1. Sabse pehle session start check karein taaki dashboard ki memory access ho sake
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include 'db.php';

// 📅 2. FINANCIAL YEAR FILTER LOGIC (Ab ye Dashboard ke chune huye saal se chalega)
$selected_fy = isset($_SESSION['global_fy']) ? $_SESSION['global_fy'] : '26-27';

// Default empty where clause
$where_clause = "";

if ($selected_fy == '25-26') {
    $start_date = '2025-04-01';
    $end_date   = '2026-03-31';
    $where_clause = "WHERE c1.service_date BETWEEN '$start_date' AND '$end_date'";
    $fy_display = "FY 2025-26";
} elseif ($selected_fy == 'all') {
    // Agar sabhi saal ka data ek saath dekhna ho
    $where_clause = ""; 
    $fy_display = "All Time Records";
} else {
    // Default Present Year 2026-27
    $start_date = '2026-04-01';
    $end_date   = '2027-03-31';
    $where_clause = "WHERE c1.service_date BETWEEN '$start_date' AND '$end_date'";
    $fy_display = "FY 2026-27";
}

// 📑 3. DYNAMIC QUERY WITH FINANCIAL YEAR FILTER (Session Protected)
$query = "SELECT c1.*, DATEDIFF(c1.expiry_date, CURDATE()) as days_left,
          CASE 
              WHEN (SELECT COUNT(*) FROM customers c2 WHERE c2.mobile = c1.mobile AND c2.id < c1.id) > 0 THEN 'Renew 🔄'
              ELSE 'New ➕'
          END AS entry_type
          FROM customers c1 
          $where_clause
          ORDER BY c1.id DESC";

$result = mysqli_query($conn, $query);
$total_customers = mysqli_num_rows($result);
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Customer List (<?php echo $fy_display; ?>)</title>
<h2>Customer Records (<?php echo $fy_display; ?>)</h2>

<style>
    :root {
        --primary: #3b82f6;
        --primary-hover: #2563eb;
        --bg-main: #f8fafc;
        --card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        --border-color: #e2e8f0;
        --text-dark: #0f172a;
        --text-muted: #64748b;
    }

    body {
        background-color: var(--bg-main);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        margin: 0;
        padding: 0;
        color: #334155;
    }

    .container {
        max-width: 1400px;
        margin: 40px auto;
        padding: 0 20px;
    }

    /* Top Sticky Header */
    .header-panel {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 20px 30px;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        margin-bottom: 25px;
        border: 1px solid #f1f5f9;
    }

    .header-panel h2 {
        font-size: 22px;
        color: var(--text-dark);
        margin: 0 0 5px 0;
        font-weight: 800;
    }

    .header-panel p {
        margin: 0;
        color: var(--text-muted);
        font-size: 13.5px;
    }

    .top-nav-btns {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .nav-btn {
        text-decoration: none;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.2s;
    }
    .btn-back { background: #f1f5f9; color: #475569; }
    .btn-back:hover { background: #e2e8f0; color: var(--text-dark); }

    /* Modern Dropdown Selector Styling */
    .fy-select {
        padding: 10px 14px;
        font-size: 14px;
        font-weight: 600;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background-color: #fff;
        color: var(--text-dark);
        cursor: pointer;
        outline: none;
    }
    .fy-select:focus {
        border-color: var(--primary);
    }

    /* Smart Interactive Filter Bar */
    .search-panel {
        background: white;
        padding: 15px 30px;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        margin-bottom: 25px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        border: 1px solid #f1f5f9;
    }

    .search-box-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 60%;
    }

    .search-input {
        width: 100%;
        padding: 12px 16px;
        font-size: 15px;
        border-radius: 10px;
        border: 1px solid var(--border-color);
        outline: none;
        background: #f8fafc;
        transition: all 0.2s;
    }

    .search-input:focus {
        border-color: var(--primary);
        background: white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .total-badge {
        background: #eff6ff;
        color: #1e40af;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 13px;
        white-space: nowrap;
        border: 1px solid #bfdbfe;
    }

    /* Premium Custom Table Panel */
    .table-card {
        background: white;
        border-radius: 16px;
        box-shadow: var(--card-shadow);
        overflow: hidden;
        border: 1px solid #f1f5f9;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th {
        background-color: #f8fafc;
        color: #475569;
        font-weight: 700;
        font-size: 12.5px;
        text-transform: uppercase;
        padding: 18px 20px;
        border-bottom: 1px solid var(--border-color);
        letter-spacing: 0.5px;
    }

    td {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
        color: #334155;
        vertical-align: middle;
    }

    tr:last-child td { border-bottom: none; }
    tr:hover { background-color: #fdfefe; }

    /* Row Data Stylings */
    .id-col { color: var(--text-muted); font-weight: 600; }
    .cert-badge { font-weight: 700; color: #1e293b; background: #f1f5f9; padding: 5px 10px; border-radius: 6px; font-size: 13px; }
    .cust-name-bold { font-weight: 600; color: var(--text-dark); font-size: 14.5px; }
    
    /* Modern Dynamic Badges */
    .status-tag {
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .status-active { background-color: #dcfce7; color: #15803d; }
    .status-due { background-color: #fef3c7; color: #b45309; }
    .status-expired { background-color: #fee2e2; color: #b91c1c; }

    .type-tag {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11.5px;
        font-weight: 600;
    }
    .type-new { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .type-renew { background-color: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }

    /* Action Control Icons */
    .action-btn {
        text-decoration: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    .btn-view-print { background: #f1f5f9; color: #334155; }
    .btn-view-print:hover { background: #e2e8f0; }

    .btn-edit-action { background: #eff6ff; color: #2563eb; }
    .btn-edit-action:hover { background: #dbeafe; }

    .btn-delete-action { background: #fff5f5; color: #e11d48; }
    .btn-delete-action:hover { background: #ffe4e6; }
</style>

</head>
<body>

<div class="container">

    <!-- Top Sticky Header -->
    <div class="header-panel">
        <div>
            <h2>👥 CUSTOMER MASTER DATABASE</h2>
            <p>Rakesh Gas Suppliers — Viewing Records for <strong><?php echo $fy_display; ?></strong></p>
        </div>
        <div class="top-nav-btns">
            <!-- 🌟 Dropdown ki jagah ab sirf ye heading dikhayein -->
            
            
            <a href="dashboard.php?fy=<?php echo ($selected_fy == 'all') ? '26-27' : $selected_fy; ?>" class="nav-btn btn-back">← Dashboard</a>
        </div>
    </div>

    <!-- Smart Interactive Filter Bar -->
    <div class="search-panel">
        <div class="search-box-wrapper">
            <span>🔍</span>
            <input type="text" id="search" class="search-input" placeholder="Type name, phone number, or certificate number to search in this year...">
        </div>
        <div class="total-badge">
            Customers in <?php echo $selected_fy == 'all' ? 'Database' : $selected_fy; ?>: <?php echo $total_customers; ?>
        </div>
    </div>

    <!-- Main Clean Table Card UI -->
    <div class="table-card">
        <table id="customerTable">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Certificate No</th>
                    <th>Customer Name</th>
                    <th>Type</th>
                    <th>Mobile</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th style="text-align: center;" colspan="3">Actions</th>
                </tr>
            </thead>
            <tbody>
            <?php 
            if($total_customers > 0) {
                while($row = mysqli_fetch_assoc($result)) { 
                    $days = intval($row['days_left']);
                    
                    // Live Status badge conditions
                    if ($days < 0) {
                        $status_badge = '<span class="status-tag status-expired">🔴 Expired</span>';
                    } elseif ($days <= 30) {
                        $status_badge = '<span class="status-tag status-due">🟡 Due ('.$days.' Days)</span>';
                    } else {
                        $status_badge = '<span class="status-tag status-active">🟢 Active ('.$days.' Days)</span>';
                    }

                    $type_class = ($row['entry_type'] == 'Renew 🔄') ? 'type-renew' : 'type-new';
                    
                    // Formatting date standard
                    $issue_formatted = date('d-m-Y', strtotime($row['service_date']));
                    $expiry_formatted = date('d-m-Y', strtotime($row['expiry_date']));
            ?>
                <tr>
                    <td class="id-col">#<?php echo $row['id']; ?></td>
                    <td><span class="cert-badge">📄 <?php echo $row['certificate_no']; ?></span></td>
                    <td><span class="cust-name-bold"><?php echo htmlspecialchars($row['customer_name']); ?></span></td>
                    <td><span class="type-tag <?php echo $type_class; ?>"><?php echo $row['entry_type']; ?></span></td>
                    <td style="font-weight: 500; color: #475569;">📞 <?php echo htmlspecialchars($row['mobile']); ?></td>
                    <td>📅 <?php echo $issue_formatted; ?></td>
                    <td>📅 <?php echo $expiry_formatted; ?></td>
                    <td style="font-weight: 700; color: #1e293b;"><?php echo $row['total_qty']; ?> Nos</td>
                    <td><?php echo $status_badge; ?></td>
                    
                    <!-- Action Blocks -->
                    <td style="width: 50px; padding-right: 5px;">
                        <a href="certificate_new.php?id=<?php echo $row['id']; ?>" class="action-btn btn-view-print" target="_blank" title="Print Certificate">🖨️</a>
                    </td>
                    <td style="width: 50px; padding-left: 5px; padding-right: 5px;">
                        <a href="edit.php?id=<?php echo $row['id']; ?>" class="action-btn btn-edit-action" title="Edit Data">✏️</a>
                    </td>
                    <td style="width: 50px; padding-left: 5px;">
                        <a href="delete.php?id=<?php echo $row['id']; ?>" onclick="return confirm('Delete this customer?')" class="action-btn btn-delete-action" title="Remove Customer">🗑️</a>
                    </td>
                </tr>
            <?php 
                } 
            } else {
                echo '<tr><td colspan="11" style="text-align:center; padding:40px; color:#64748b; font-weight:500;">Is Financial Year me koi bhi customer record nahi mila.</td></tr>';
            }
            ?>
            </tbody>
        </table>
    </div>

</div>

<!-- Realtime Filtering JavaScript System -->
<script>
document.getElementById("search").addEventListener("keyup", function(){
    let filter = this.value.toLowerCase().trim();
    let rows = document.querySelectorAll("#customerTable tbody tr");
    let matchFound = false;

    rows.forEach((row) => {
        if(row.classList.contains('no-data-alert')) {
            row.remove();
            return;
        }

        let text = row.innerText.toLowerCase();
        if(text.includes(filter)) {
            row.style.display = "";
            matchFound = true;
        } else {
            row.style.display = "none";
        }
    });

    let tbody = document.querySelector("#customerTable tbody");
    let alertRow = document.querySelector('.no-data-alert');
    
    if(!matchFound && !alertRow && rows.length > 0) {
        let newRow = document.createElement('tr');
        newRow.className = 'no-data-alert';
        newRow.innerHTML = `<td colspan="11" style="text-align:center; padding: 30px; color: #64748b; font-weight: 500;">🔍 Keyword "${this.value}" ke naam ka koi customer nahi mila.</td>`;
        tbody.appendChild(newRow);
    } else if(matchFound && alertRow) {
        alertRow.remove();
    }
});
</script>

<script src="fire.js"></script>

</body>
</html>