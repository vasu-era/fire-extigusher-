<?php
include 'db.php';

// Dashboard se bheja gaya Customer ID catch karein
if (!isset($_GET['id']) || empty($_GET['id'])) {
    die("Error: Customer ID missing.");
}

$old_id = mysqli_real_escape_string($conn, $_GET['id']);

// Purane customer ki details fetch karein naye form me autofill karne ke liye
$result = mysqli_query($conn, "SELECT * FROM customers WHERE id='$old_id'");
$row = mysqli_fetch_assoc($result);

// 📅 1. Today/Default Date se Financial Year Pata Karein (Initial Load)
$service_date = date('Y-m-d');
$time    = strtotime($service_date);
$s_month = (int)date('m', $time);
$s_year  = (int)date('Y', $time);

if ($s_month >= 4) {
    $fy_start = $s_year . '-04-01';
    $fy_end   = ($s_year + 1) . '-03-31';
    $fy_short = date('y', $time) . '-' . date('y', strtotime('+1 year', $time));
} else {
    $fy_start = ($s_year - 1) . '-04-01';
    $fy_end   = $s_year . '-03-31';
    $fy_short = date('y', strtotime('-1 year', $time)) . '-' . date('y', $time);
}

$prefix = "RGS/" . $fy_short . "/";

// 🔢 2. Current FY ke sabse highest certificate no. ka logic
$max_cert_query = mysqli_query($conn, "SELECT certificate_no FROM customers 
                                       WHERE service_date BETWEEN '$fy_start' AND '$fy_end' 
                                       AND certificate_no LIKE '$prefix%' 
                                       ORDER BY id DESC LIMIT 1");
$max_cert_row = mysqli_fetch_assoc($max_cert_query);

$next_number = 1;

if ($max_cert_row) {
    $latest_cert = $max_cert_row['certificate_no'];
    $parts = explode('/', $latest_cert);
    $last_part = end($parts);
    
    if (is_numeric($last_part)) {
        $next_number = (int)$last_part + 1;
    }
}

$next_certificate_no = $prefix . $next_number;
?>

<!DOCTYPE html>
<html>
<head>
    <title>RAKESH GAS SUPPLIERS - Renew Customer</title>
    <link rel="stylesheet" href="fire.css">
    <style>
        .remove-btn {
            background-color: #e57373;
            color: white;
            border: none;
            padding: 6px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }
        .remove-btn:hover {
            background-color: #d32f2f;
        }
        .action-th-td {
            text-align: center;
            width: 80px;
        }
    </style>
</head>
<body>

<div class="container">

    <div class="logo-title">
        <h1>RAKESH GAS SUPPLIERS</h1>
        <p>Fire Extinguisher Service Management System (New Renewal Mode)</p>
        <p style="color: #2e7d32; font-weight: bold; font-size: 14px;">✅ Last year's data is fully safe in history.</p>
    </div>

    <form id="customerForm" action="save.php" method="POST">

        <div class="form-grid">

            <div class="form-group">
                <label>Customer Name <span class="required">*</span></label>
                <input type="text" name="customer_name" value="<?php echo htmlspecialchars($row['customer_name']); ?>" required>
            </div>

            <div class="form-group">
                <label>Mobile Number<span class="required">*</span></label>
                <input type="tel" name="mobile" value="<?php echo htmlspecialchars($row['mobile']); ?>" placeholder="Enter 10 Digit no." pattern="[0-9]{10}" maxlength="10" required>
            </div>
            
            <div class="form-group full-width">
                <label>Address<span class="required">*</span></label>
                <textarea name="address" rows="2" required><?php echo htmlspecialchars($row['address']); ?></textarea>
            </div>
            
            <div class="form-group">
                <label>New Certificate Number <span class="required">*</span></label>
                <input type="text" id="certificate_no" name="certificate_no" value="<?php echo $next_certificate_no; ?>" required style="background-color: #f1f3f5; font-weight: bold; color: #495057;">
            </div>
            
            <div class="form-group">
                <label>New Issue Date <span class="required">*</span></label>
                <input type="date" id="service_date" name="service_date" onchange="fetchRenewCertificateNo(this.value); calculateExpiryDate();" required>
            </div>

           <div class="form-group">
                <label>Validity Duration <span class="required">*</span></label>
                <select id="expiry_duration" name="expiry_duration" onchange="calculateExpiryDate()" required>
                    <option value="12" selected>1 Year (Standard)</option>
                    <option value="6">6 Month</option>
                    <option value="24">2 Years</option>
                    <option value="36">3 Years</option>
                    <option value="60">5 Years</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>New Expiry Date *</label>
                <input type="text" id="expiry_date" name="expiry_date" placeholder="MM/DD/YYYY" readonly required>
            </div>

            <div class="form-group full-width">
                <h3>Extinguisher Details (Carried Forward)<span class="required">*</span></h3>

                <table id="extinguisherTable">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Capacity</th>
                            <th>Qty</th>
                            <th>Service Type</th>
                            <th>Amount</th>
                            <th class="action-th-td">Action</th>
                        </tr>
                    </thead>
                    <tbody id="extinguisherTbody">
                        <?php
                        // Purane items nikalen taaki duplicate fillup na karna pade
                        $extResult = mysqli_query($conn, "SELECT * FROM extinguisher_details WHERE customer_id='$old_id'");
                        
                        if(mysqli_num_rows($extResult) > 0) {
                            while($ext = mysqli_fetch_assoc($extResult)) {
                                $service_type = isset($ext['service_action_type']) ? $ext['service_action_type'] : 'refilling';
                                $ref_price = isset($ext['ext_refilling_price']) ? $ext['ext_refilling_price'] : '';
                                $new_price = isset($ext['ext_new_price']) ? $ext['ext_new_price'] : '';
                                
                                $ref_display = ($service_type === 'new') ? 'display: none;' : 'display: block;';
                                $new_display = ($service_type === 'new') ? 'display: block;' : 'display: none;';
                        ?>
                        <tr>
                            <td>
                                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                                    <option value="ABC" <?php if($ext['ext_type'] == 'ABC') echo 'selected'; ?>>ABC Powder</option>
                                    <option value="CO2" <?php if($ext['ext_type'] == 'CO2') echo 'selected'; ?>>CO2</option>
                                    <option value="Water" <?php if($ext['ext_type'] == 'Water') echo 'selected'; ?>>Water</option>
                                    <option value="Foam" <?php if($ext['ext_type'] == 'Foam') echo 'selected'; ?>>Foam</option>
                                </select>
                            </td>

                            <td>
                                <select name="ext_capacity[]" class="capacity" required>
                                    <option value="<?php echo $ext['ext_capacity']; ?>" selected><?php echo $ext['ext_capacity']; ?></option>
                                </select>
                            </td>

                            <td>
                                <input type="number" name="ext_qty[]" class="ext-qty" value="<?php echo $ext['ext_qty']; ?>" min="1" oninput="calculateTotalQty()" required>
                            </td>

                            <!-- 🔄 Service Type Dropdown -->
                            <td>
                                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                                    <option value="refilling" <?php if($service_type == 'refilling') echo 'selected'; ?>>Refilling Only</option>
                                    <option value="new" <?php if($service_type == 'new') echo 'selected'; ?>>New Bottle/Sale</option>
                                </select>
                            </td>

                            <!-- 💰 Amount Fields -->
                            <td>
                                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01" value="<?php echo $ref_price; ?>" style="<?php echo $ref_display; ?>">
                                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" value="<?php echo $new_price; ?>" style="<?php echo $new_display; ?>">
                            </td>

                            <td class="action-th-td">
                                <button type="button" class="remove-btn" onclick="deleteThisRow(this)">✕</button>
                            </td>
                        </tr>
                        <?php 
                            }
                        } else { 
                        ?>
                        <tr>
                            <td>
                                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                                    <option value="">Select Type</option>
                                    <option value="ABC">ABC Powder</option>
                                    <option value="CO2">CO2</option>
                                    <option value="Water">Water</option>
                                    <option value="Foam">Foam</option>
                                </select>
                            </td>
                            <td>
                                <select name="ext_capacity[]" class="capacity" required>
                                    <option value="">Select Capacity</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" name="ext_qty[]" class="ext-qty" value="1" min="1" oninput="calculateTotalQty()" required>
                            </td>
                            <td>
                                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                                    <option value="refilling">Refilling Only</option>
                                    <option value="new">New Bottle/Sale</option>
                                </select>
                            </td>
                            <td>
                                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01">
                                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" style="display: none;">
                            </td>
                            <td class="action-th-td">
                                <button type="button" class="remove-btn" onclick="deleteThisRow(this)">✕</button>
                            </td>
                        </tr>
                        <?php } ?>
                    </tbody>
                </table>

                <div style="margin-top: 10px;">
                    <button type="button" class="add-btn" onclick="customAddRow()">+ Add Extinguisher</button>
                </div>
            </div>
            
            <div class="form-group">
                <label>Total Qty.<span class="required">*</span></label>
                <input type="text" id="total_qty" name="total_qty" value="<?php echo !empty($row['total_qty']) ? $row['total_qty'] : '1'; ?>" readonly required>
            </div>

        </div>

        <button type="submit" class="save-btn">🚀 GENERATE RENEWED CERTIFICATE</button>

    </form>

</div>

<script src="fire.js"></script>
<script>
    // 📄 Fetch Dynamic Certificate Number on Date Change
    function fetchRenewCertificateNo(selectedDate) {
        let certInput = document.getElementById('certificate_no');
        if (!certInput) return;

        fetch('get_next_cer.php?service_date=' + encodeURIComponent(selectedDate))
            .then(response => response.text())
            .then(next_cert_no => {
                certInput.value = next_cert_no.trim();
            })
            .catch(error => console.error('Error fetching certificate number:', error));
    }

    // 🔄 Dynamic toggling function for input element states
    function togglePriceFields(selectElement) {
        var row = selectElement.closest('tr');
        var refInput = row.querySelector('.ref-input');
        var newInput = row.querySelector('.new-input');
        
        if (selectElement.value === 'new') {
            refInput.style.display = 'none';
            refInput.value = ''; 
            newInput.style.display = 'block';
        } else {
            newInput.style.display = 'none';
            newInput.value = ''; 
            refInput.style.display = 'block';
        }
    }

    // 🚀 Fixed custom adder with synchronized rows
    function customAddRow() {
        let tbody = document.getElementById('extinguisherTbody') || document.querySelector('#extinguisherTable tbody');
        let tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>
                <select name="ext_type[]" onchange="updateCapacity(this)" required>
                    <option value="">Select Type</option>
                    <option value="ABC">ABC Powder</option>
                    <option value="CO2">CO2</option>
                    <option value="Water">Water</option>
                    <option value="Foam">Foam</option>
                </select>
            </td>
            <td>
                <select name="ext_capacity[]" class="capacity" required>
                    <option value="">Select Capacity</option>
                </select>
            </td>
            <td>
                <input type="number" name="ext_qty[]" class="ext-qty" value="1" min="1" oninput="calculateTotalQty()" required>
            </td>
            <td>
                <select name="service_action_type[]" class="form-control service-toggle" onchange="togglePriceFields(this)">
                    <option value="refilling">Refilling Only</option>
                    <option value="new">New Bottle/Sale</option>
                </select>
            </td>
            <td>
                <input type="number" name="ext_refilling_price[]" class="form-control ref-input" placeholder="Refill Rate" min="0" step="0.01">
                <input type="number" name="ext_new_price[]" class="form-control new-input" placeholder="New Bottle Rate" min="0" step="0.01" style="display: none;">
            </td>
            <td class="action-th-td">
                <button type="button" class="remove-btn" onclick="deleteThisRow(this)">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
        calculateTotalQty();
    }

    function deleteThisRow(button) {
        let tbody = document.getElementById('extinguisherTbody') || document.querySelector('#extinguisherTable tbody');
        let rows = tbody.getElementsByTagName('tr');
        if (rows.length > 1) {
            button.closest('tr').remove();
            calculateTotalQty();
        } else {
            alert("At least one item is required!");
        }
    }

    window.onload = function() {
        calculateTotalQty(); 
        let issueDateInput = document.getElementById('service_date');
        let durationInput = document.getElementById('expiry_duration');

        // Page open hote hi aaj ki date select kar ke naya Certificate Number fetch karega
        if (issueDateInput) {
            if (!issueDateInput.value) {
                let today = new Date().toISOString().split('T')[0];
                issueDateInput.value = today;
            }
            fetchRenewCertificateNo(issueDateInput.value);

            issueDateInput.addEventListener('input', calculateExpiryDate);
            issueDateInput.addEventListener('change', calculateExpiryDate);
        }
        
        if (durationInput) {
            durationInput.addEventListener('change', calculateExpiryDate);
        }
    };
</script>

</body>
</html>