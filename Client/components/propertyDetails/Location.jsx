import React from "react";

export default function Location() {
  return (
    <>
      <div className="wg-title text-11 fw-6 text-color-heading">
        Hubungi Admin untuk melihat lokasi Detail properti ini
      </div>
      <iframe
        className="map"
        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d100000!2d113.7032!3d-8.1736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sid!2sid!4v1727094281524"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </>
  );
}
