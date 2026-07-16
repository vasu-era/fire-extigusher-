// 🧠 1. Auto Total Quantity Calculation Function
function calculateTotalQty() {
    let qtyInputs = document.querySelectorAll('.ext-qty');
    let total = 0;

    qtyInputs.forEach(function(input) {
        let val = parseInt(input.value);
        if (!isNaN(val)) {
            total += val;
        }
    });

    let totalQtyField = document.getElementById('total_qty');
    if (totalQtyField) {
        totalQtyField.value = total;
    }
}

// 📅2. Standard Auto Expiry Date Calculation (Pure Native Mode)
function calculateExpiryDate() {
    let issueDateInput = document.getElementById('service_date');
    let durationInput = document.getElementById('expiry_duration');
    let expiryDateInput = document.getElementById('expiry_date');
    
    if (issueDateInput && durationInput && expiryDateInput) {
        let issueDateVal = issueDateInput.value; 
        let durationMonths = parseInt(durationInput.value)||12;
        
        if (issueDateVal) {
            let date = new Date(issueDateVal);
            
            if (date && !isNaN(date.getTime())) {
                date.setMonth(date.getMonth() + durationMonths);
                date.setDate(date.getDate() - 1);

                let year = date.getFullYear();
                let month = String(date.getMonth() + 1).padStart(2, '0');
                let day = String(date.getDate()).padStart(2, '0');
                
                expiryDateInput.value = `${month}/${day}/${year}`;
            }
        } else {
            expiryDateInput.value = "";
        }
    }
}

// 🧪 3. Extinguisher Type change hone par Capacity options load karna
function updateCapacity(select){
    let row = select.closest("tr");
    let capacity = row.querySelector(".capacity");

    capacity.innerHTML = '<option value="">Select Capacity</option>';

    let options = [];

    if(select.value === "ABC"){
        options = ["1 KG","2 KG","4 KG","6 KG","9 KG","25 KG","50 KG"];
    }
    else if(select.value === "CO2"){
        options = ["2 KG","3 KG","4.5 KG","6.5 KG","22.5 KG"];
    }
    else if(select.value === "Water"){
        options = ["6 LTR","9 LTR"];
    }
    else if(select.value === "Foam"){
        options = ["6 LTR","9 LTR","50 LTR"];
    }

    options.forEach(function(item){
        let option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        capacity.appendChild(option);
    });
}

// 🔄 3.5 Dynamic Price Input Toggle (Naya Function)
function togglePriceFields(selectElement) {
    let row = selectElement.closest('tr');
    let refInput = row.querySelector('.ref-input');
    let newInput = row.querySelector('.new-input');
    
    if (selectElement.value === 'new') {
        if(refInput) { refInput.style.display = 'none'; refInput.value = ''; }
        if(newInput) { newInput.style.display = 'block'; }
    } else {
        if(newInput) { newInput.style.display = 'none'; newInput.value = ''; }
        if(refInput) { refInput.style.display = 'block'; }
    }
}

// ➕ 4. Nayi Row Add karna (UPDATED with Service Type & Price Toggle)
function customAddRow() {
    let table = document.getElementById('extinguisherTable') || document.querySelector('table');
    if (!table) {
        alert("Table nahi mila! Kripya check karein ki table ki ID 'extinguisherTable' hai ya nahi.");
        return;
    }

    let tbody = table.querySelector('tbody');
    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    }
    
    let tr = document.createElement('tr');
    
    // Updated row inside: isme service selection aur single dynamic price input box integrated hai
    tr.innerHTML = `
        <td>
            <select name="ext_type[]" onchange="updateCapacity(this)" class="form-control" required>
                <option value="">Select Type</option>
                <option value="ABC">ABC Powder</option>
                <option value="CO2">CO2</option>
                <option value="Water">Water</option>
                <option value="Foam">Foam</option>
            </select>
        </td>
        <td>
            <select name="ext_capacity[]" class="capacity form-control" required>
                <option value="">Select Capacity</option>
            </select>
        </td>
        <td>
            <input type="number" name="ext_qty[]" class="ext-qty form-control" value="1" min="1" oninput="calculateTotalQty()" required>
        </td>
        <td style="text-align: center;">
            <button type="button" class="btn btn-danger" onclick="removeCurrentRow(this)">Delete</button>
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
    `;
    
    tbody.appendChild(tr);
    
    if (typeof calculateTotalQty === "function") {
        calculateTotalQty();
    }
}

// 🗑️ 5. Kisi bhi Specific Row ko Delete Karna (Selected Row Removal)
function removeCurrentRow(button){
    let row = button.closest("tr");
    if(row) {
        row.remove();
        calculateTotalQty();
    }
}

// 🔢 6. Auto Certificate Number Generation (Sirf Display Ke Liye)
function displayCertificateNo() {
    let lastNumber = parseInt(localStorage.getItem("certificateNumber")) || 26; 
    let nextNumber = lastNumber + 1; 

    let today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    let startYear;
    let endYear;

    if(month >= 4){
        startYear = year;
        endYear = String(year + 1).slice(-2);
    } else {
        startYear = year - 1;
        endYear = String(year).slice(-2);
    }

    let certificateNo = "RGS/" + startYear + "-" + endYear + "/" + nextNumber;

    let certField = document.getElementById("certificate_no");
    if (certField) {
        certField.value = certificateNo;
    }
}

// 🔒 7. Form Submit hone par hi localStorage me counter save hoga
function confirmCertificateNo() {
    let inputField = document.getElementById("certificate_no");
    let lastNumber = parseInt(localStorage.getItem("certificateNumber")) || 26;
    let nextNumber = lastNumber + 1;

    if (inputField && inputField.value.includes("/" + nextNumber)) {
        localStorage.setItem("certificateNumber", nextNumber);
    }
}

// 🚀 8. Page Load Listener (Jo New aur Edit dono form par chalega)
window.onload = function() {
    if (typeof displayCertificateNo === "function") displayCertificateNo();
    if (typeof calculateTotalQty === "function") calculateTotalQty(); 

    let issueDateInput = document.getElementById('service_date');
    let durationInput = document.getElementById('expiry_duration');

    if (issueDateInput && durationInput) {
        calculateExpiryDate();
        issueDateInput.addEventListener('change', calculateExpiryDate);
        durationInput.addEventListener('change', calculateExpiryDate);
    }
};

// 🌐 9. Global Exit Shortcut Key (Saare Pages Ke Liye)
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        let activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
            window.location.href = 'dashboard.php'; 
        }
    }
});

// ⌨️ 10. Direct Arrow Key Form Navigation (Up/Down/Left/Right)
document.addEventListener('keydown', function(event) {
    const activeElem = document.activeElement;
    
    if (!['input', 'select', 'textarea'].includes(activeElem.tagName.toLowerCase())) {
        return;
    }

    const formInputs = Array.from(document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([readonly]), select, textarea, button.save-btn'
    ));
    const currentIndex = formInputs.indexOf(activeElem);

    if (currentIndex === -1) return;

    let nextElem = null;

    if (event.key === 'ArrowDown') {
        if (activeElem.tagName.toLowerCase() === 'select') {
            return; 
        }
        if (currentIndex < formInputs.length - 1) {
            event.preventDefault();
            nextElem = formInputs[currentIndex + 1];
        }
    }
    else if (event.key === 'ArrowUp') {
        if (activeElem.tagName.toLowerCase() === 'select') {
            return; 
        }
        if (currentIndex > 0) {
            event.preventDefault();
            nextElem = formInputs[currentIndex - 1];
        }
    }
    else if (event.key === 'ArrowRight') {
        if (activeElem.tagName.toLowerCase() === 'select' || activeElem.type === 'number' || activeElem.selectionEnd === activeElem.value.length) {
            if (currentIndex < formInputs.length - 1) {
                event.preventDefault();
                nextElem = formInputs[currentIndex + 1];
            }
        }
    }
    else if (event.key === 'ArrowLeft') {
        if (activeElem.tagName.toLowerCase() === 'select' || activeElem.type === 'number' || activeElem.selectionStart === 0) {
            if (currentIndex > 0) {
                event.preventDefault();
                nextElem = formInputs[currentIndex - 1];
            }
        }
    }

    if (nextElem) {
        nextElem.focus();
        if (typeof nextElem.select === 'function') {
            nextElem.select();
        }
    }
});

// ⌨️ 11. Ctrl + S dabane par Direct Button Click Shortcut
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault(); 
        
        let submitButton = document.querySelector('button[type="submit"]') || 
                           document.querySelector('input[type="submit"]') ||
                           document.querySelector('.form-group button');

        if (submitButton) {
            console.log("Ctrl+S detected: Clicking submit button...");
            submitButton.click(); 
        } else {
            let customerForm = document.querySelector('form');
            if (customerForm) {
                if (customerForm.checkValidity()) {
                    customerForm.submit();
                } else {
                    customerForm.reportValidity();
                }
            }
        }
    }
});