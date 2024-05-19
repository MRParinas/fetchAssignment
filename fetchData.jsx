const Pagination = ({ items, pageSize, onPageChange }) => {
  const { Button } = ReactBootstrap;
  if (items.length <= 1) return null;

  const num = Math.ceil(items.length / pageSize);
  const pages = range(1, num + 1);
  const list = pages.map(page => (
      <Button key={page} onClick={() => onPageChange(page)} className="page-item">
          {page}
      </Button>
  ));

  return (
      <nav>
          <ul className="pagination">{list}</ul>
      </nav>
  );
};

const range = (start, end) => {
  return Array(end - start + 1).fill(0).map((_, i) => start + i);
};

const paginate = (items, pageNumber, pageSize) => {
  const start = (pageNumber - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
      isLoading: false,
      isError: false,
      data: initialData
  });

  useEffect(() => {
      let didCancel = false;

      const fetchData = async () => {
          dispatch({ type: "FETCH_INIT" });
          try {
              const result = await axios(url);
              if (!didCancel) {
                  dispatch({ type: "FETCH_SUCCESS", payload: result.data });
              }
          } catch (error) {
              if (!didCancel) {
                  dispatch({ type: "FETCH_FAILURE" });
              }
          }
      };

      fetchData();

      return () => {
          didCancel = true;
      };
  }, [url]);

  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
      case "FETCH_INIT":
          return {
              ...state,
              isLoading: true,
              isError: false
          };
      case "FETCH_SUCCESS":
          return {
              ...state,
              isLoading: false,
              isError: false,
              data: action.payload
          };
      case "FETCH_FAILURE":
          return {
              ...state,
              isLoading: false,
              isError: true
          };
      default:
          throw new Error();
  }
};

const App = () => {
  const { Fragment, useState } = React;
  const [query, setQuery] = useState("Query");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
      `https://chroniclingamerica.loc.gov/search/titles/results/?terms=${query}&format=json`,
      { items: [] }
  );

  const handlePageChange = page => {
      setCurrentPage(page);
  };

  let page = data.items;
  if (page.length >= 1) {
      page = paginate(page, currentPage, pageSize);
      console.log(`currentPage: ${currentPage}`);
  }

  return (
      <Fragment>
          <form
              onSubmit={event => {
                  doFetch(`https://chroniclingamerica.loc.gov/search/titles/results/?terms=${query}&format=json`);
                  event.preventDefault();
              }}
          >
              <input
                  type="text"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
              />
              <button type="submit">Search</button>
          </form>

          {isError && <div>Something went wrong ...</div>}

          {isLoading ? (
              <div>Loading ...</div>
          ) : (
              <ul className="list-group">
                  {page.map(item => (
                      <li key={item.id} className="list-group-item">
                          <a href={item.url}>{item.title}</a>
                      </li>
                  ))}
              </ul>
          )}
          <Pagination
              items={data.items}
              pageSize={pageSize}
              onPageChange={handlePageChange}
          />
      </Fragment>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
