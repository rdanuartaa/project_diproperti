"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const initialArticles = [
  {
    id: 101,
    user_id: 2,
    image: "",
    title: "Panduan Membeli Rumah Pertama",
    slug: "panduan-membeli-rumah-pertama",
    description: "Ringkasan tips penting sebelum membeli rumah pertama.",
    content:
      "Isi artikel lengkap tentang tahapan membeli rumah pertama.",
    created_at: "2024-01-10 09:30:00",
    updated_at: "2024-02-01 14:15:00",
  },
  {
    id: 102,
    user_id: 3,
    image: "",
    title: "Tren Properti 2024",
    slug: "tren-properti-2024",
    description: "Gambaran singkat tren pasar properti tahun ini.",
    content:
      "Isi artikel lengkap tentang tren properti dan prediksi pasar.",
    created_at: "2024-02-05 10:00:00",
    updated_at: "2024-03-12 16:45:00",
  },
];

const emptyForm = {
  image: "",
  title: "",
  description: "",
  content: "",
  newImages: [],
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function Artikel() {
  const [articles, setArticles] = useState(initialArticles);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const activeTitle = useMemo(
    () => activeArticle?.title || "Selected Article",
    [activeArticle],
  );

  const openCreate = () => {
    setFormData(emptyForm);
    setIsCreateOpen(true);
  };

  const openEdit = (article) => {
    setActiveArticle(article);
    setFormData({
      image: article.image ?? "",
      title: article.title ?? "",
      description: article.description ?? "",
      content: article.content ?? "",
      newImages: [],
    });
    setIsEditOpen(true);
  };

  const openDelete = (article) => {
    setActiveArticle(article);
    setIsDeleteOpen(true);
  };

  const closeAll = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setActiveArticle(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.newImages.length > 10) {
      alert("Maksimal 10 gambar diperbolehkan");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));
  };

  const handleRemoveNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveExistingImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const previewImage = formData.newImages[0]
      ? URL.createObjectURL(formData.newImages[0])
      : formData.image;
    const timestamp = new Date().toISOString();
    const next = {
      id: Date.now(),
      user_id: 0,
      image: previewImage || "",
      title: formData.title,
      slug: slugify(formData.title),
      description: formData.description,
      content: formData.content,
      created_at: timestamp,
      updated_at: timestamp,
    };
    setArticles((prev) => [next, ...prev]);
    closeAll();
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const previewImage = formData.newImages[0]
      ? URL.createObjectURL(formData.newImages[0])
      : formData.image || activeArticle?.image || "";
    setArticles((prev) =>
      prev.map((item) =>
        item.id === activeArticle?.id
          ? {
              ...item,
              image: previewImage,
              title: formData.title,
              slug: slugify(formData.title),
              description: formData.description,
              content: formData.content,
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    closeAll();
  };

  const handleDelete = () => {
    if (!activeArticle?.id) return;
    setArticles((prev) => prev.filter((item) => item.id !== activeArticle.id));
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
                  Article Status:<span>*</span>
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
                  placeholder="Search by title..."
                />
              </fieldset>
            </form>
          </div>
        </div>

        <div className="widget-box-2 wd-listing mt-20">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-12">
            <h3 className="title">My Articles</h3>
            <button
              type="button"
              className="tf-btn style-border pd-23"
              onClick={openCreate}
            >
              Create Article
            </button>
          </div>

          <div className="wrap-table">
            <div className="table-responsive">
              {articles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No articles found. Click "Create Article" to add one.
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Article</th>
                      <th>Slug</th>
                      <th>Admin</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => (
                      <tr key={article.id} className="file-delete">
                        <td>
                          <div className="listing-box">
                            <div className="images">
                              {article.image ? (
                                <Image
                                  alt={article.title}
                                  src={article.image}
                                  width={150}
                                  height={100}
                                  className="object-cover rounded"
                                />
                              ) : (
                                <div className="w-[150px] h-[100px] bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="content">
                              <div className="title">
                                <Link
                                  href={`/article/${article.slug}`}
                                  className="link"
                                >
                                  {article.title}
                                </Link>
                              </div>
                              <div className="text-date">
                                {article.description || "No description"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span>{article.slug}</span>
                        </td>
                        <td>
                          <span>Admin #{article.user_id}</span>
                        </td>
                        <td>
                          <span>{article.updated_at}</span>
                        </td>
                        <td>
                          <ul className="list-action">
                            <li>
                              <button
                                type="button"
                                className="item"
                                onClick={() => openEdit(article)}
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
                                onClick={() => openDelete(article)}
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
                  Delete Article?
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
                  {isCreateOpen && "Create Article"}
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
                        Article Information
                      </h6>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Title</label>
                        <input
                          type="text"
                          name="title"
                          className="form-control"
                          placeholder="Judul Artikel"
                          value={formData.title}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>
                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Description</label>
                        <textarea
                          name="description"
                          className="textarea"
                          rows={3}
                          placeholder="Describe the article highlights..."
                          value={formData.description}
                          onChange={handleChange}
                        />
                      </fieldset>
                    </div>

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Content</label>
                        <textarea
                          name="content"
                          className="textarea"
                          rows={6}
                          placeholder="Write the full article content..."
                          value={formData.content}
                          onChange={handleChange}
                          required
                        />
                      </fieldset>
                    </div>

                    <div className="col-12 mt-4">
                      <h6 className="modal-section-title fw-bold border-bottom pb-2 mb-3">
                        Article Image
                      </h6>
                    </div>

                    {isEditOpen && formData.image && (
                      <div className="col-12 mb-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Existing image:
                        </p>
                        <div className="box-img-upload">
                          <div className="item-upload file-delete">
                            <Image
                              src={formData.image}
                              alt="Article"
                              width={615}
                              height={405}
                            />
                            <button
                              type="button"
                              className="icon icon-trashcan1 remove-file"
                              onClick={handleRemoveExistingImage}
                              aria-label="Remove image"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <fieldset className="box-fieldset">
                        <label>Upload New Images</label>
                        <div className="box-uploadfile text-center">
                          <div className="uploadfile">
                            <label className="tf-btn bg-color-primary pd-10 btn-upload mx-auto">
                              <svg
                                width={21}
                                height={20}
                                viewBox="0 0 21 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M13.625 14.375V17.1875C13.625 17.705 13.205 18.125 12.6875 18.125H4.5625C4.31386 18.125 4.0754 18.0262 3.89959 17.8504C3.72377 17.6746 3.625 17.4361 3.625 17.1875V6.5625C3.625 6.045 4.045 5.625 4.5625 5.625H6.125C6.54381 5.62472 6.96192 5.65928 7.375 5.72834M13.625 14.375H16.4375C16.955 14.375 17.375 13.955 17.375 13.4375V9.375C17.375 5.65834 14.6725 2.57417 11.125 1.97834C10.7119 1.90928 10.2938 1.87472 9.875 1.875H8.3125C7.795 1.875 7.375 2.295 7.375 2.8125V5.72834M13.625 14.375H8.3125C8.06386 14.375 7.8254 14.2762 7.64959 14.1004C7.47377 13.9246 7.375 13.6861 7.375 13.4375V5.72834M17.375 11.25V9.6875C17.375 8.94158 17.0787 8.22621 16.5512 7.69876C16.0238 7.17132 15.3084 6.875 14.5625 6.875H13.3125C13.0639 6.875 12.8254 6.77623 12.6496 6.60041C12.4738 6.4246 12.375 6.18614 12.375 5.9375V4.6875C12.375 4.31816 12.3023 3.95243 12.1609 3.6112C12.0196 3.26998 11.8124 2.95993 11.5512 2.69876C11.2901 2.4376 10.98 2.23043 10.6388 2.08909C10.2976 1.94775 9.93184 1.875 9.5625 1.875H8.625"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Select photos
                              <input
                                type="file"
                                name="images"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                                className="ip-file"
                              />
                            </label>
                            <p className="file-name fw-5">
                              or drag photos here <br />
                              <span>(Up to 10 photos)</span>
                            </p>
                          </div>
                        </div>

                        {formData.newImages?.length > 0 && (
                          <div className="box-img-upload">
                            {Array.from(formData.newImages).map((file, idx) => (
                              <div
                                key={idx}
                                className="item-upload file-delete"
                              >
                                <Image
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${idx + 1}`}
                                  width={615}
                                  height={405}
                                />
                                <button
                                  type="button"
                                  className="icon icon-trashcan1 remove-file"
                                  onClick={() => handleRemoveNewImage(idx)}
                                  aria-label="Remove image"
                                />
                              </div>
                            ))}
                          </div>
                        )}
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
