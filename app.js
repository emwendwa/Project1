const { useState } = React;

// ============================================================
//  UPDATE RATES HERE ONLY – 2025 KENYA RATES
// ============================================================

const CURRENT_YEAR = 2025;

const TAX_RATES = {
  VAT:             0.16,
  IDF:             0.025,
  RDL:             0.02,
  CAR_DUTY:        0.35,
  MOTORCYCLE_DUTY: 0.25
};

const CAR_EXCISE = {
  EV:           0.10,
  UP_TO_1500:   0.20,
  _1501_3000:   0.25,
  ABOVE_3000:   0.35
};

const MOTORCYCLE_EXCISE = {
  UP_TO_500CC:  0.00,
  ABOVE_500CC:  0.25
};

const DEPRECIATION_PERCENT = [0, 20, 35, 45, 50, 55, 60, 65];

const HS_CODES = [
  { code: "8711.10", desc: "Motorcycles ≤50cc",          duty: 25, excise: 0 },
  { code: "8711.20", desc: "Motorcycles 50–250cc",       duty: 25, excise: 0 },
  { code: "8711.30", desc: "Motorcycles 250–500cc",      duty: 25, excise: 0 },
  { code: "8711.40", desc: "Motorcycles 500–800cc",      duty: 25, excise: 25 },
  { code: "8711.50", desc: "Motorcycles >800cc",         duty: 25, excise: 25 },
  { code: "8703",    desc: "Motor Cars",                 duty: 35, excise: "engine" },
  { code: "8702",    desc: "Buses",                      duty: 25, excise: 0 },
  { code: "8704",    desc: "Trucks",                     duty: 10, excise: 0 },
  { code: "8517",    desc: "Mobile Phones",              duty: 10, excise: 10 },
  { code: "OTHER",   desc: "Other Goods",                duty: null, excise: 0 }
];

// ============================================================
//  MAIN APP
// ============================================================

function App() {
  const [itemType, setItemType] = useState("car");
  const [hsCode, setHsCode] = useState("8711.50");
  const [form, setForm] = useState({
    crsp: "", year: CURRENT_YEAR, cc: "", isEV: false, shipping: "",
    motoCIF: "", motoCC: "",
    cif: "", manualDuty: 25
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);

  const selectedHS = HS_CODES.find(h => h.code === hsCode) || HS_CODES[HS_CODES.length-1];

  const validate = () => {
    const e = {};
    if (itemType === "car") {
      if (!form.crsp || form.crsp <= 0) e.crsp = "Enter CRSP";
      if (!form.year || form.year < 2000) e.year = "Valid year";
      if (!form.isEV && (!form.cc || form.cc <= 0)) e.cc = "Enter CC mathématiques";
    }
    if (itemType === "motorcycle") {
      if (!form.motoCIF || form.motoCIF <= 0) e.motoCIF = "Enter CIF";
      if (!form.motoCC || form.motoCC <= 0) e.motoCC = "Enter CC";
    }
    if (itemType === "cargo") {
      if (!form.cif || form.cif <= 0) e.cif = "Enter CIF";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const calculate = () => {
    if (!validate()) return;

    let cv = 0, importDutyRate = 0, exciseRate = 0;

    if (itemType === "car") {
      const age = CURRENT_YEAR - parseInt(form.year);
      const dep = DEPRECIATION_PERCENT[Math.min(Math.max(age, 0), 7)] / 100;
      const depreciated = parseFloat(form.crsp) * (1 - dep);
      cv = depreciated + parseFloat(form.shipping || 0);
      importDutyRate = TAX_RATES.CAR_DUTY;
      exciseRate = form.isEV ? CAR_EXCISE.EV :
        parseInt(form.cc) <= 1500 ? CAR_EXCISE.UP_TO_1500 :
        parseInt(form.cc) <= 3000 ? CAR_EXCISE._1501_3000 : CAR_EXCISE.ABOVE_3000;
    }

    else if (itemType === "motorcycle") {
      cv = parseFloat(form.motoCIF);
      importDutyRate = TAX_RATES.MOTORCYCLE_DUTY;
      exciseRate = parseInt(form.motoCC) > 500 ? MOTORCYCLE_EXCISE.ABOVE_500CC : MOTORCYCLE_EXCISE.UP_TO_500CC;
    }

    else {
      cv = parseFloat(form.cif);
      importDutyRate = selectedHS.duty !== null ? selectedHS.duty / 100 : parseFloat(form.manualDuty) / 100;
      exciseRate = selectedHS.excise === "engine" ? 0 : (selectedHS.excise || 0) / 100;
    }

    const importDuty = cv * importDutyRate;
    const exciseBase = cv + importDuty;
    const excise = exciseBase * exciseRate;
    const vatBase = exciseBase + excise;
    const vat = vatBase * TAX_RATES.VAT;
    const idf = cv * TAX_RATES.IDF;
    const rdl = cv * TAX_RATES.RDL;
    const totalTaxes = importDuty + excise + vat + idf + rdl;
    const totalLanded = cv + totalTaxes;

    setResult({
      cv, importDuty, excise, vat, idf, rdl, totalTaxes, totalLanded,
      importDutyPct: (importDutyRate * 100).toFixed(0),
      excisePct: (exciseRate * 100).toFixed(0),
      itemType
    });
  };

  return (
    <div className="container">
      <h1>Kenya Import Duty Calculator 2025 Copyright EddMwendwa</h1>

      <label>Item Type:</label>
      <select value={itemType} onChange={(e) => { setItemType(e.target.value); setResult(null); }}>
        <option value="car">Car / Vehicle</option>
        <option value="motorcycle">Motorcycle</option>
        <option value="cargo">General Cargo</option>
      </select>

      {/* ==================== CAR ==================== */}
      {itemType === "car" && (
        <>
          <label>CRSP Value (KES):</label>
          <input type="number" name="crsp" value={form.crsp} onChange={handleChange} placeholder="e.g. 2500000" />
          {errors.crsp && <div className="error">{errors.crsp}</div>}

          <label>Year of Manufacture:</label>
          <input type="number" name="year" value={form.year} onChange={handleChange} min="2000" max={CURRENT_YEAR} />

          <label>Engine Capacity (cc):</label>
          <input type="number" name="cc" value={form.cc} onChange={handleChange} placeholder="e.g. 2000" disabled={form.isEV} />

          <label>
            <input type="checkbox" name="isEV" checked={form.isEV} onChange={handleChange} /> Electric Vehicle (EV)?
          </label>

          <label>Shipping + Insurance (KES):</label>
          <input type="number" name="shipping" value={form.shipping} onChange={handleChange} placeholder="0" />
        </>
      )}

      {/* ==================== MOTORCYCLE ==================== */}
      {itemType === "motorcycle" && (
        <>
          <label>CIF Value (KES):</label>
          <input type="number" name="motoCIF" value={form.motoCIF} onChange={handleChange} placeholder="e.g. 350000" />

          <label>Engine Capacity (cc):</label>
          <input type="number" name="motoCC" value={form.motoCC} onChange={handleChange} placeholder="e.g. 650" />

          <p><strong>Auto:</strong> Duty 25% | Excise {form.motoCC > 500 ? "25%" : "0%"}</p>
        </>
      )}

      {/* ==================== CARGO ==================== */}
      {itemType === "cargo" && (
        <>
          <label>HS Code:</label>
          <select value={hsCode} onChange={(e) => setHsCode(e.target.value)}>
            {HS_CODES.map(h => (
              <option key={h.code} value={h.code}>{h.code} – {h.desc}</option>
            ))}
          </select>

          <label>CIF Value (KES):</label>
          <input type="number" name="cif" value={form.cif} onChange={handleChange} placeholder="e.g. 500000" />

          {selectedHS.duty === null && (
            <>
              <label>Manual Duty %:</label>
              <input type="number" name="manualDuty" value={form.manualDuty} onChange={handleChange} />
            </>
          )}
        </>
      )}

      <button onClick={calculate} style={{marginTop: '30px', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', width: '100%', fontSize: '18px'}}>
        Calculate Taxes
      </button>

      {result && (
        <div className="result">
          <h3>{result.itemType.toUpperCase()} – Tax Breakdown</h3>
          <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
            <tbody>
              <tr><td>Customs Value</td><td style={{textAlign: 'right'}}>{result.cv.toLocaleString()} KES</td></tr>
              <tr><td>Import Duty ({result.importDutyPct}%)</td><td style={{textAlign: 'right'}}>{result.importDuty.toLocaleString()}</td></tr>
              <tr><td>Excise Duty ({result.excisePct}%)</td><td style={{textAlign: 'right'}}>{result.excise.toLocaleString()}</td></tr>
              <tr><td>VAT 16%</td><td style={{textAlign: 'right'}}>{result.vat.toLocaleString()}</td></tr>
              <tr><td>IDF 2.5%</td><td style={{textAlign: 'right'}}>{result.idf.toLocaleString()}</td></tr>
              <tr><td>RDL 2%</td><td style={{textAlign: 'right'}}>{result.rdl.toLocaleString()}</td></tr>
              <tr style={{background: '#f0f0f0'}}><td><strong>Total Taxes</strong></td><td style={{textAlign: 'right'}}><strong>{result.totalTaxes.toLocaleString()} KES</strong></td></tr>
              <tr style={{background: '#e8f5e9'}}><td><strong>Total Landed Cost</strong></td><td style={{textAlign: 'right'}}><strong>{result.totalLanded.toLocaleString()} KES</strong></td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));