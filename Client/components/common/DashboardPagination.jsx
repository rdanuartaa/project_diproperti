"use client";

export const DASHBOARD_PAGE_SIZE = 10;

export const paginateDashboardItems = (
  items,
  currentPage,
  pageSize = DASHBOARD_PAGE_SIZE,
) => {
  const startIndex = (currentPage - 1) * pageSize;
  return (items || []).slice(startIndex, startIndex + pageSize);
};

export const getDashboardTotalPages = (
  totalItems,
  pageSize = DASHBOARD_PAGE_SIZE,
) => Math.max(1, Math.ceil((totalItems || 0) / pageSize));

const DOTS = "dots";

const getVisiblePages = (currentPage, pageCount) => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, DOTS, pageCount];
  if (currentPage >= pageCount - 2) {
    return [1, DOTS, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, DOTS, currentPage, DOTS, pageCount];
};

export default function DashboardPagination({
  currentPage,
  totalItems,
  totalPages,
  onPageChange,
  pageSize = DASHBOARD_PAGE_SIZE,
}) {
  const pageCount =
    totalPages || getDashboardTotalPages(totalItems, pageSize);
  const total = totalItems || 0;

  if (total <= 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  const goToPage = (page) => {
    if (page < 1 || page > pageCount || page === currentPage) return;
    onPageChange(page);
  };

  return (
    <div className="dashboard-pagination-wrap">
      <ul className="wg-pagination dashboard-pagination">
        <li className={`arrow ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Halaman sebelumnya"
          >
            <i className="icon-arrow-left" />
          </button>
        </li>

        {getVisiblePages(currentPage, pageCount).map((page, index) =>
          page === DOTS ? (
            <li key={`${page}-${index}`} className="ellipsis">
              <span>...</span>
            </li>
          ) : (
            <li key={page} className={page === currentPage ? "active" : ""}>
              <button
                type="button"
                onClick={() => goToPage(page)}
                disabled={page === currentPage}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            </li>
          ),
        )}

        <li className={`arrow ${currentPage === pageCount ? "disabled" : ""}`}>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            aria-label="Halaman berikutnya"
          >
            <i className="icon-arrow-right" />
          </button>
        </li>
      </ul>

      <p className="dashboard-pagination-info">
        Menampilkan {from}-{to} of {total} hasil
      </p>
    </div>
  );
}
