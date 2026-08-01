# Fire Sticker Print Service

Local Windows Node.js service that prints fire extinguisher stickers through BarTender.

The deployed web app can be opened in the browser on this same PC. When `Print Sticker` is clicked, the browser calls this local service directly at `http://localhost:10000`, and this service overwrites `temp/sticker.csv` before launching BarTender.

## Setup

1. Install Node.js 18+ on the same Windows PC where BarTender and the TSC TE244 printer are installed.
2. Copy `.env.example` to `.env`.
3. Fill these values:

```env
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BARTENDER_PATH=C:\Program Files\Seagull\BarTender\bartend.exe
BARTENDER_TEMPLATE=C:\Labels\2026.btw
CSV_TEMP=C:\Users\ASUS\OneDrive\Desktop\fire extingudher\fire-app\print-service\temp\sticker.csv
```

4. In BarTender, configure the `.btw` template data source to read the same `CSV_TEMP` file.
5. Install dependencies and start:

```bash
npm install
npm start
```

6. Confirm service is running:

```bash
curl http://localhost:10000/health
```

## Print API

```http
POST /api/certificates/:id/print
Content-Type: application/json
```

Optional request body from the web app:

```json
{
  "stickers": [
    { "id": 1, "quantity": 2 },
    { "id": 2, "quantity": 1 }
  ]
}
```

If no `stickers` array is provided, the service prints using each extinguisher row's database quantity.

## CSV Format

The service overwrites `temp/sticker.csv` for every print:

```csv
Type,Capacity,RefillDate,ExpiryDate
ABC TYPE,4.5 KG,01/08/2026,31/07/2027
```

Multiple copies are written as repeated CSV rows so BarTender prints one sticker per row.

## Logs

Print attempts are logged as JSON lines in:

```txt
logs/print.log
```
