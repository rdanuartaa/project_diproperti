import React from "react";

export default function Features({ property }) {
  // ✅ Fallback jika property belum tersedia
  if (!property || !property.detail) {
    return (
      <>
        <div className="wg-title text-11 fw-6 text-color-heading">
          Fasilitas Tambahan
        </div>
        <div className="wrap-feature">
          <div className="box-feature">
            <ul>
              {[...Array(5)].map((_, i) => (
                <li key={i} className="feature-item text-color-default">
                  Memuat fasilitas...
                </li>
              ))}
            </ul>
          </div>
          <div className="box-feature">
            <ul>
              {[...Array(5)].map((_, i) => (
                <li key={i} className="feature-item text-color-default">
                  -
                </li>
              ))}
            </ul>
          </div>
          <div className="box-feature">
            <ul>
              {[...Array(4)].map((_, i) => (
                <li key={i} className="feature-item text-color-default">
                  -
                </li>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
  }

  const detail = property.detail || {};

  // ✅ Helper: Format water type dengan label
  const formatWater = (val) => {
    const map = { 
      pdam: "Air PDAM", 
      sumur: "Air Sumur" 
    };
    return val ? map[val.toLowerCase()] || `Air: ${val}` : null;
  };

  // ✅ Helper: Format electricity type dengan label
  const formatElectricity = (val) => {
    const map = { 
      overground: "Listrik Tiang", 
      underground: "Listrik Bawah Tanah" 
    };
    return val ? map[val.toLowerCase()] || `Listrik: ${val}` : null;
  };

  // ✅ Helper: Format WiFi provider dengan label
  const formatWifi = (val) => {
    return val ? `WiFi ${val}` : null;
  };

  // ✅ Build dynamic features list (SEMUA BAHASA INDONESIA)
  const features = [
    // Boolean facilities - tampilkan nama jika true
    detail.carport ? "Garasi Mobil" : null,
    detail.garden ? "Taman Pribadi" : null,
    detail.one_gate_system ? "Sistem Satu Pintu" : null,
    detail.security_24jam ? "Keamanan 24 Jam" : null,
    
    // Water type - tampilkan dengan label
    formatWater(detail.water),
    
    // Electricity type - tampilkan dengan label
    formatElectricity(detail.listrik_type),
    
    // WiFi provider - tampilkan dengan label
    formatWifi(detail.wifi_provider),
  ].filter(item => item); // ✅ Filter: hanya tampilkan yang ada value-nya

  // ✅ DISTRIBUTE ITEMS EVENLY ACROSS 3 COLUMNS
  const col1 = [];
  const col2 = [];
  const col3 = [];

  features.forEach((item, index) => {
    if (index % 3 === 0) {
      col1.push(item);
    } else if (index % 3 === 1) {
      col2.push(item);
    } else {
      col3.push(item);
    }
  });

  // ✅ Render list items helper
  const renderItems = (items) =>
    items.map((item, idx) => (
      <li key={idx} className="feature-item">
        {item}
      </li>
    ));

  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Fasilitas Tambahan
      </div>
      <div className="wrap-feature">
        
        {/* KOLOM 1 */}
        <div className="box-feature">
          <ul>
            {col1.length > 0 ? renderItems(col1) : (
              <li className="feature-item text-color-default">-</li>
            )}
          </ul>
        </div>

        {/* KOLOM 2 */}
        <div className="box-feature">
          <ul>
            {col2.length > 0 ? renderItems(col2) : (
              <li className="feature-item text-color-default">-</li>
            )}
          </ul>
        </div>

        {/* KOLOM 3 */}
        <div className="box-feature">
          <ul>
            {col3.length > 0 ? renderItems(col3) : (
              <li className="feature-item text-color-default">-</li>
            )}
          </ul>
        </div>

      </div>
    </>
  );
}