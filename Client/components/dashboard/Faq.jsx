"use client";

import React, { useMemo, useState } from "react";

const initialFaqs = [
  {
    id: 1,
    question: "Bagaimana cara memasang iklan properti?",
    answer: "Masuk ke dashboard, pilih menu Properti, lalu klik Create.",
    topic: "platform",
    status: "published",
    created_at: "2024-03-10 10:00:00",
    updated_at: "2024-03-12 08:30:00",
  },
  {
    id: 2,
    question: "Apa syarat pengajuan KPR?",
    answer: "Dokumen identitas, slip gaji, dan bukti kepemilikan.",
    topic: "kpr",
    status: "draft",
    created_at: "2024-03-15 14:10:00",
    updated_at: "2024-03-16 09:20:00",
  },
];

const emptyForm = {
  question: "",
  answer: "",
  topic: "umum",
  status: "draft",
};

export default function Faq() {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const activeTitle = useMemo(
    () => activeFaq?.question || "Selected FAQ",
    [activeFaq],
  );

  const openCreate = () => {
    setFormData(emptyForm);
    setIsCreateOpen(true);
  };

  const openEdit = (faq) => {
    setActiveFaq(faq);
    setFormData({
      question: faq.question ?? "",
      answer: faq.answer ?? "",
      topic: faq.topic ?? "umum",
      status: faq.status ?? "draft",
    });
    setIsEditOpen(true);
  };

  const openDelete = (faq) => {
    setActiveFaq(faq);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setActiveFaq(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const next = {
      id: Date.now(),
      question: formData.question,
      answer: formData.answer,
      topic: formData.topic,
      status: formData.status,
      created_at: timestamp,
      updated_at: timestamp,
    };
    setFaqs((prev) => [next, ...prev]);
    closeAll();
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setFaqs((prev) =>
      prev.map((item) =>
        item.id === activeFaq?.id
          ? {
              ...item,
              question: formData.question,
              answer: formData.answer,
              topic: formData.topic,
              status: formData.status,
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    closeAll();
  };

  const handleDelete = () => {
    if (!activeFaq?.id) return;
    setFaqs((prev) => prev.filter((item) => item.id !== activeFaq.id));
    closeAll();
  };

  return (
    <div className="main-content w-100">
      <div className="main-content-inner wrap-dashboard-content">
        <div className="row">
          <div className="col-md-3">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Status:<span>*</span>
                </label>
                <select className="form-control">
                  <option>All</option>
                  <option>published</option>
                  <option>draft</option>
                </select>
              </fieldset>
            </form>
          </div>
          <div className="col-md-9">
            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset className="box-fieldset">
                <label>
                  Search:<span>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by question..."
                />
              </fieldset>
            </form>
          </div>
        </div>

        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">FAQ</h3>
            <button
              type="button"
              className="tf-btn style-border pd-23"
              onClick={openCreate}
            >
              Create FAQ
            </button>
          </div>

          <div className="wrap-table">
            <div className="table-responsive">
              {faqs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No FAQ found. Click "Create FAQ" to add one.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id} className="file-delete">
                        <td>
                          <div className="listing-box">
                            <div className="content">
                              <div className="title">{faq.question}</div>
                              <div className="text-date">
                                {faq.answer || "No answer"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span>{faq.topic}</span>
                        </td>
                        <td>
                          <span
                            className={`px-3 py-1 text-xs rounded-full ${
                              faq.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {faq.status}
                          </span>
                        </td>
                        <td>
                          <span>{faq.updated_at}</span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <button
                                type="button"
                                className="item"
                                onClick={() => openEdit(faq)}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.2413 2.9915L12.366 1.86616C12.6005 1.63171 12.9184 1.5 13.25 1.5C13.5816 1.5 13.8995 1.63171 14.134 1.86616C14.3685 2.10062 14.5002 2.4186 14.5002 2.75016C14.5002 3.08173 14.3685 3.39971 14.134 3.63416L4.55467 13.2135C4.20222 13.5657 3.76758 13.8246 3.29 13.9668L1.5 14.5002L2.03333 12.7102C2.17552 12.2326 2.43442 11.7979 2.78667 11.4455L11.242 2.9915H11.2413ZM11.2413 2.9915L13 4.75016"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Edit
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                className="remove-file item"
                                onClick={() => openDelete(faq)}
                              >
                                <svg
                                  width={16}
                                  height={16}
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9.82667 6.00035L9.596 12.0003M6.404 12.0003L6.17333 6.00035M12.8187 3.86035C13.0467 3.89501 13.2733 3.93168 13.5 3.97101M12.8187 3.86035L12.1067 13.1157C12.0776 13.4925 11.9074 13.8445 11.63 14.1012C11.3527 14.3579 10.9886 14.5005 10.6107 14.5003H5.38933C5.0114 14.5005 4.64735 14.3579 4.36999 14.1012C4.09262 13.8445 3.92239 13.4925 3.89333 13.1157L3.18133 3.86035M12.8187 3.86035C12.0492 3.74403 11.2758 3.65574 10.5 3.59568M3.18133 3.86035C2.95333 3.89435 2.72667 3.93101 2.5 3.97035M3.18133 3.86035C3.95076 3.74403 4.72416 3.65575 5.5 3.59568M10.5 3.59568V2.98501C10.5 2.19835 9.89333 1.54235 9.10667 1.51768C8.36908 1.49411 7.63092 1.49411 6.89333 1.51768C6.10667 1.54235 5.5 2.19901 5.5 2.98501V3.59568M10.5 3.59568C8.83581 3.46707 7.16419 3.46707 5.5 3.59568"
                                    stroke="#A3ABB0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                Delete
                              </button>
                            </li>
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <ul className="wg-pagination">
              <li className="arrow">
                <a href="#">
                  <i className="icon-arrow-left" />
                </a>
              </li>
              <li className="active">
                <a href="#">1</a>
              </li>
              <li className="arrow">
                <a href="#">
                  <i className="icon-arrow-right" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-dashboard">
          <p>Copyright (c) {new Date().getFullYear()} Propty</p>
          <ul className="list">
            <li>
              <a href="#">Privacy</a>
            </li>
            <li>
              <a href="#">Terms</a>
            </li>
            <li>
              <a href="#">Support</a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className={`overlay-dashboard ${isCreateOpen || isEditOpen || isDeleteOpen ? "show" : ""}`}
        onClick={closeAll}
      />

      {isDeleteOpen && (
        <div
          className="modal show d-block"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={closeAll}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: "500px",
              width: "100%",
              margin: "0 auto",
              pointerEvents: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content"
              style={{
                pointerEvents: "auto",
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              <div
                className="modal-header border-0 pb-0"
                style={{ padding: "1.5rem 1.5rem 0" }}
              >
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAll}
                  style={{ position: "absolute", right: "1rem", top: "1rem" }}
                  aria-label="Close"
                />
              </div>

              <div
                className="modal-body text-center pt-0 pb-4"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                <div className="mb-4">
                  <div
                    className="mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: "#1f2937" }}>
                  Delete FAQ?
                </h4>
                <p
                  className="text-gray-600 mb-1"
                  style={{ fontSize: "1rem", lineHeight: "1.5" }}
                >
                  Are you sure you want to delete{" "}
                  <strong style={{ color: "#111827" }}>{activeTitle}</strong>?
                </p>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  This action cannot be undone.
                </p>
              </div>

              <div
                className="modal-footer border-0 justify-content-center gap-3"
                style={{ padding: "0 1.5rem 1.5rem" }}
              >
                <button
                  type="button"
                  className="btn btn-light px-4 py-2"
                  onClick={closeAll}
                  style={{
                    borderRadius: "8px",
                    fontWeight: "500",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4 py-2"
                  onClick={handleDelete}
                  style={{
                    borderRadius: "8px",
                    fontWeight: "500",
                    backgroundColor: "#dc2626",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isCreateOpen || isEditOpen) && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header modal-header-title">
                <h5 className="modal-title">
                  {isCreateOpen && "Create FAQ"}
                  {isEditOpen && `Edit: ${activeTitle}`}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAll}
                  aria-label="Close"
                />
              </div>

              <div
                className="modal-body modal-body-wide"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <form
                  className="modal-form-spacing"
                  onSubmit={isCreateOpen ? handleCreate : handleUpdate}
                >
                  <div className="row g-3">
                    <div className="col-12">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        FAQ Information
                      </h6>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Question</label>
                        <input
                          type="text"
                          name="question"
                          className="form-control"
                          placeholder="Tulis pertanyaan FAQ"
                          value={formData.question}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Answer</label>
                        <textarea
                          name="answer"
                          className="textarea"
                          rows={4}
                          placeholder="Tulis jawaban FAQ"
                          value={formData.answer}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Topic</label>
                        <select
                          name="topic"
                          className="form-control"
                          value={formData.topic}
                          onChange={handleChange}
                        >
                          <option value="properti">properti</option>
                          <option value="kpr">kpr</option>
                          <option value="platform">platform</option>
                          <option value="umum">umum</option>
                        </select>
                      </fieldset>
                    </div>

                    <div className="col-md-6">
                      <fieldset className="box-fieldset">
                        <label>Status</label>
                        <select
                          name="status"
                          className="form-control"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                        </select>
                      </fieldset>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-12 mt-20">
                    <button
                      type="button"
                      className="tf-btn style-border"
                      onClick={closeAll}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="tf-btn">
                      {isCreateOpen ? "Create" : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
