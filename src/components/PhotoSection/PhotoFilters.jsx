import './PhotoFilters.css';
function PhotoFilters({
    photoView,
    album,
    uploaderSearch,
    setUploaderSearch,
    dateFilter,
    setDateFilter,
    sortOrder,
    setSortOrder
})
{
    return(
        <>
            {
    (
        (photoView === "all" &&
         album.access_type === "public")
        ||
        photoView === "uploads"
    ) && (

        <div className="photo-filters">

            {photoView === "all" && (
                <input
                    type="text"
                    placeholder="Search uploader..."
                    value={uploaderSearch}
                    onChange={(e) =>
                        setUploaderSearch(e.target.value)
                    }
                    className="photo-search"
                />
            )}

            <select
                value={dateFilter}
                onChange={(e) =>
                    setDateFilter(e.target.value)
                }
                className="photo-filter-select"
            >
                <option value="all">
                    All Dates
                </option>

                <option value="today">
                    Today
                </option>

                <option value="7days">
                    Last 7 Days
                </option>

                <option value="30days">
                    Last 30 Days
                </option>
            </select>

            <select
                value={sortOrder}
                onChange={(e) =>
                    setSortOrder(e.target.value)
                }
                className="photo-filter-select"
            >
                <option value="newest">
                    Newest First
                </option>

                <option value="oldest">
                    Oldest First
                </option>
            </select>

        </div>
    )
}
        </>
    )
}

export default PhotoFilters;