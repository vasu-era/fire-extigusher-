<?php
// 1. Sabse pehle session start check karein taaki dashboard ki memory access ho sake
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include 'db.php';

// 📅 2. DASHBOARD KE SAATH FINANCIAL YEAR SYNC LOGIC (Session Protected)
// Ab ye URL ke badle, Dashboard me select kiye huye saal se chalega
$selected_fy = isset($_SESSION['global_fy']) ? $_SESSION['global_fy'] : '26-27';

if ($selected_fy == '25-26') {
    $start_date = '2025-04-01';
    $end_date   = '2026-03-31';
    $fy_display = "2025-26";
} else {
    // Default Present Year 2026-27
    $start_date = '2026-04-01';
    $end_date   = '2027-03-31';
    $fy_display = "2026-27";
}

$selected_month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));
$selected_year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

$check_date = "$selected_year-" . str_pad($selected_month, 2, '0', STR_PAD_LEFT) . "-01";
if ($check_date < $start_date || $check_date > $end_date) {
    $selected_month = intval(date('m', strtotime($start_date)));
    $selected_year = intval(date('Y', strtotime($start_date)));
}

// 📑 3. MAIN DATA QUERY WITH SESSION FILTER
$query = "SELECT c1.*, DATEDIFF(c1.expiry_date, CURDATE()) as days_left,
          CASE 
              WHEN (SELECT COUNT(*) FROM customers c2 WHERE c2.mobile = c1.mobile AND c2.id < c1.id) > 0 THEN 'Renew 🔄'
              ELSE 'New ➕'
          END AS entry_type
          FROM customers c1 
          WHERE (
              ((MONTH(c1.service_date) = '$selected_month' AND YEAR(c1.service_date) = '$selected_year'))
              OR 
              ((MONTH(c1.expiry_date) = '$selected_month' AND YEAR(c1.expiry_date) = '$selected_year'))
          )
          AND c1.service_date BETWEEN '$start_date' AND '$end_date'
          ORDER BY c1.expiry_date ASC"; 

$report_result = mysqli_query($conn, $query);

// 📊 4. SUMMARY STATS
$total_report = 0;
$active_count = 0;
$due_count = 0;
$expired_count = 0;
$new_customers_count = 0;
$renew_customers_count = 0;

$rows = [];
while ($r = mysqli_fetch_assoc($report_result)) {
    $rows[] = $r;
    $total_report++;
    
    if ($r['entry_type'] == 'Renew 🔄') {
        $renew_customers_count++;
    } else {
        $new_customers_count++;
    }

    $days = intval($r['days_left']);
    if ($days < 0) {
        $expired_count++;
    } elseif ($days <= 30) {
        $due_count++;
    } else {
        $active_count++;
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Service Report (FY <?php echo $fy_display; ?>)</title>
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #334155;
        }

        .report-container {
            max-width: 1400px;
            margin: 40px auto;
            padding: 0 20px;
        }

        /* Header Styling */
        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            padding: 20px 30px;
            border-radius: 16px;
            box-shadow: var(--card-shadow);
            margin-bottom: 25px;
        }

        .logo-title h2 {
            font-size: 22px;
            color: var(--text-dark);
            margin: 0 0 5px 0;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        .logo-title p {
            margin: 0;
            color: var(--text-muted);
            font-size: 13.5px;
            font-weight: 500;
        }

        .back-dash-btn {
            background: #f1f5f9;
            color: #475569;
            text-decoration: none;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 13.5px;
            font-weight: 600;
            transition: all 0.2s;
        }
        .back-dash-btn:hover {
            background: #e2e8f0;
            color: var(--text-dark);
        }

        /* Modern Filter Bar */
        .filter-section {
            background: white;
            padding: 18px 30px;
            border-radius: 16px;
            box-shadow: var(--card-shadow);
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .filter-form {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .input-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .input-group label {
            font-size: 13.5px;
            font-weight: 600;
            color: #475569;
        }

        .filter-section select {
            padding: 9px 14px;
            font-size: 14px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background-color: #f8fafc;
            color: var(--text-dark);
            font-weight: 500;
            outline: none;
            cursor: pointer;
        }

        /* Action Buttons */
        .btn-actions-group {
            display: flex;
            gap: 10px;
        }

        .btn-style {
            padding: 10px 18px;
            font-size: 13.5px;
            font-weight: 600;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s;
        }
        .btn-style:hover { opacity: 0.9; }

        .btn-view { background-color: var(--primary); color: white; }
        .btn-print { background-color: #059669; color: white; }
        .btn-excel { background-color: #ea580c; color: white; }

        .fy-badge {
            background-color: #eff6ff;
            color: #1e40af;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            border: 1px solid #bfdbfe;
        }

        /* 📊 Premium Dashboard Stats Cards Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            margin-bottom: 25px;
        }

        .stat-card {
            background: white;
            padding: 20px 15px;
            border-radius: 14px;
            box-shadow: var(--card-shadow);
            position: relative;
            overflow: hidden;
            border: 1px solid #f1f5f9;
        }
        
        /* Subtle side accent indicator bars instead of thick top borders */
        .stat-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 5px;
            background: #cbd5e1;
        }

        .stat-card.total::before { background: #3b82f6; }
        .stat-card.new-type::before { background: #10b981; }
        .stat-card.renew-type::before { background: #6366f1; }
        .stat-card.active::before { background: #22c55e; }
        .stat-card.due::before { background: #f59e0b; }
        .stat-card.expired::before { background: #ef4444; }

        .stat-card h3 {
            margin: 0 0 6px 0;
            font-size: 11.5px;
            color: var(--text-muted);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.5px;
        }

        .stat-card p {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
            color: var(--text-dark);
        }

        /* 🗂️ Clean Elegant Table Layout */
        .table-wrapper {
            background: white;
            border-radius: 16px;
            box-shadow: var(--card-shadow);
            overflow: hidden;
            border: 1px solid #f1f5f9;
        }

        .report-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }

        .report-table th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 700;
            font-size: 12.5px;
            text-transform: uppercase;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            letter-spacing: 0.5px;
        }

        .report-table td {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #334155;
            vertical-align: middle;
        }

        .report-table tr:last-child td { border-bottom: none; }
        .report-table tr:hover { background-color: #fdfefe; }
        
        .cert-bold { font-weight: 700; color: #1e293b; }

        /* Badges Styling */
        .status-badge {
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .status-active { background-color: #dcfce7; color: #15803d; }
        .status-due { background-color: #fef3c7; color: #b45309; }
        .status-expired { background-color: #fee2e2; color: #b91c1c; }
        
        .type-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 600;
            display: inline-block;
        }
        .type-new { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .type-renew { background-color: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }

        .job-tag {
            display: inline-block;
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .print-btn-link {
            text-decoration: none;
            background: #f1f5f9;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 14px;
            transition: background 0.2s;
        }
        .print-btn-link:hover { background: #e2e8f0; }

        @media print {
            .filter-section, .btn-action, .print-btn-link, .back-dash-btn { display: none !important; }
            body { background: white; color: black; }
            .report-container { max-width: 100%; padding: 0; margin: 0; }
            .stat-card { border: 1px solid #ccc !important; box-shadow: none !important; }
            .stat-card::before { display: none; }
        }
    </style>
</head>
<body>

<div class="report-container">

    <!-- Header Panel -->
    <div class="header-section">
        <div class="logo-title">
            <h2>📅 MONTHLY SERVICE REPORT</h2>
            <p>RAKESH GAS SUPPLIERS — Fire Extinguisher Infrastructure Portal</p>
        </div>
        <a href="dashboard.php?fy=<?php echo $selected_fy; ?>" class="back-dash-btn">← Dashboard</a>
    </div>

    <!-- Filter section -->
    <div class="filter-section">
        <form method="GET" action="" class="filter-form">
            <input type="hidden" name="fy" value="<?php echo htmlspecialchars($selected_fy); ?>">
            
            <div class="input-group">
                <label>Month</label>
                <select name="month">
                    <?php
                    for ($m = 1; $m <= 12; $m++) {
                        $month_name = date('F', mktime(0, 0, 0, $m, 1));
                        $selected = ($m == $selected_month) ? 'selected' : '';
                        echo "<option value='$m' $selected>$month_name</option>";
                    }
                    ?>
                </select>
            </div>

            <div class="input-group">
                <label>Year</label>
                <select name="year">
                    <?php
                    $start_year_bound = intval(date('Y', strtotime($start_date)));
                    $end_year_bound = intval(date('Y', strtotime($end_date)));
                    
                    for ($y = $start_year_bound; $y <= $end_year_bound; $y++) {
                        $selected = ($y == $selected_year) ? 'selected' : '';
                        echo "<option value='$y' $selected>$y</option>";
                    }
                    ?>
                </select>
            </div>

            <div class="btn-actions-group">
                <button type="submit" class="btn-style btn-view">🔍 Filter Report</button>
                <button type="button" class="btn-style btn-print" onclick="window.print()">🖨 Print</button>
                <button type="button" class="btn-style btn-excel" onclick="exportToExcel()">📊 Export Excel</button>
            </div>
        </form>

        <div class="fy-badge">
            Financial Year: <?php echo $fy_display; ?>
        </div>
    </div>

    <!-- Stats Display Panel -->
    <div class="stats-grid">
        <div class="stat-card total">
            <h3>Total Records</h3>
            <p><?php echo str_pad($total_report, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
        <div class="stat-card new-type">
            <h3>New Cust.</h3>
            <p><?php echo str_pad($new_customers_count, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
        <div class="stat-card renew-type">
            <h3>Renewed</h3>
            <p><?php echo str_pad($renew_customers_count, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
        <div class="stat-card active">
            <h3>Active</h3>
            <p><?php echo str_pad($active_count, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
        <div class="stat-card due">
            <h3>Expiry Due</h3>
            <p><?php echo str_pad($due_count, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
        <div class="stat-card expired">
            <h3>Expired</h3>
            <p><?php echo str_pad($expired_count, 2, '0', STR_PAD_LEFT); ?></p>
        </div>
    </div>

    <!-- Main Table Panel Layout -->
    <div class="table-wrapper">
        <table class="report-table" id="reportTable">
            <thead>
                <tr>
                    <th>Certificate No.</th>
                    <th>Customer Name</th>
                    <th>Type</th> 
                    <th>Mobile</th>
                    <th>Issue Date</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                    <th class="btn-action" style="text-align: center;">Action</th>
                </tr>
            </thead>
            <tbody>
            <?php
            if (mysqli_num_rows($report_result) > 0) {
                mysqli_data_seek($report_result, 0); 

                while ($row = mysqli_fetch_assoc($report_result)) {
                    $days = intval($row['days_left']);
                    
                    $is_service_this_month = (date('m', strtotime($row['service_date'])) == $selected_month && date('Y', strtotime($row['service_date'])) == $selected_year);
                    $is_expiry_this_month = (date('m', strtotime($row['expiry_date'])) == $selected_month && date('Y', strtotime($row['expiry_date'])) == $selected_year);
                    
                    if ($days < 0) {
                        $status_html = '<span class="status-badge status-expired">🔴 Expired</span>';
                        $days_text = 'Expired';
                    } elseif ($days <= 30) {
                        $status_html = '<span class="status-badge status-due">🟡 Due</span>';
                        $days_text = $days . ' Days';
                    } else {
                        $status_html = '<span class="status-badge status-active">🟢 Active</span>';
                        $days_text = $days . ' Days';
                    }

                    $type_note = "";
                    if ($is_service_this_month && $is_expiry_this_month) {
                        $type_note = "<br><span class=\"job-tag\" style=\"background:#faf5ff; color:#7e22ce;\">🔄 Done & Expiring</span>";
                    } elseif ($is_service_this_month) {
                        $type_note = "<br><span class=\"job-tag\" style=\"background:#ecfdf5; color:#047857;\">✨ Job Done This Month</span>";
                    } elseif ($is_expiry_this_month) {
                        $type_note = "<br><span class=\"job-tag\" style=\"background:#fff5f5; color:#e11d48;\">⚠️ Expiring This Month</span>";
                    }

                    $type_class = ($row['entry_type'] == 'Renew 🔄') ? 'type-renew' : 'type-new';

                    $issue_dt = date('d-m-Y', strtotime($row['service_date']));
                    $expiry_dt = date('d-m-Y', strtotime($row['expiry_date']));
            ?>
            <tr>
                <td class="cert-bold">📄 <?php echo $row['certificate_no']; ?></td>
                <td>
                    <span style="font-weight: 600; color: #1e293b;"><?php echo htmlspecialchars($row['customer_name']); ?></span>
                    <?php echo $type_note; ?>
                </td>
                <td>
                    <span class="type-badge <?php echo $type_class; ?>">
                        <?php echo $row['entry_type']; ?>
                    </span>
                </td>
                <td style="font-weight: 500; color: #475569;">📞 <?php echo htmlspecialchars($row['mobile']); ?></td>
                <td>📅 <?php echo $issue_dt; ?></td>
                <td>📅 <?php echo $expiry_dt; ?></td>
                <td style="font-weight: 600;"><?php echo $days_text; ?></td>
                <td><?php echo $status_html; ?></td>
                <td class="btn-action" style="text-align: center;">
                    <a href="certificate_new.php?id=<?php echo $row['id']; ?>" target="_blank" class="print-btn-link" title="Print">🖨️ Print</a>
                </td>
            </tr>
            <?php
                }
            } else {
                echo '<tr><td colspan="9" style="text-align:center; color:#64748b; padding:40px; font-weight:500;">Is Financial Year (' . $fy_display . ') ke select mahine me koi data nahi mila.</td></tr>';
            }
            ?>
            </tbody>
        </table>
    </div>

</div>

<script>
function exportToExcel() {
    let table = document.getElementById("reportTable");
    let html = table.outerHTML;

    html = html.replace(/<th class="btn-action">Action<\/th>/g, "");
    html = html.replace(/<td class="btn-action">.*?<\/td>/g, "");

    let url = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
    let downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = 'Monthly_Service_Report_' + '<?php echo $selected_month . "_" . $selected_year; ?>.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        window.location.href = 'dashboard.php?fy=<?php echo $selected_fy; ?>';
    }
});
</script>

</body>
</html>