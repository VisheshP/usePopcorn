import { useEffect, useState } from "react";
import StarRating from "./StarRating.js";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "febc5740";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchString, setSearchString] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  function handleMovieSelect(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbId !== id));
  }

  useEffect(
    function () {
      const controller = new AbortController();

      async function handleMovies() {
        try {
          setError("");
          setIsLoading(true);
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${KEY}&s=${searchString}`,
            { signal: controller.signal }
          );

          if (!res.ok)
            throw new Error(
              "Unable to fetch the movies. Please check your Network"
            );

          const data = await res.json();

          if (data.Response === "False") throw new Error("Movie not found");

          setMovies(data.Search);
        } catch (error) {
          console.log(error.message);

          if (error.name !== "AbortError") {
            setError(error.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (searchString.length < 3) {
        setMovies([]);
        setError("");
        return;
      }

      handleCloseMovie();
      handleMovies();

      return function () {
        controller.abort();
      };
    },
    [searchString]
  );

  return (
    <>
      <NavBar>
        <Search searchString={searchString} onSearch={setSearchString} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {/* {isLoading ? <Loader /> : <MovieList movies={movies} />}*/}
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList onMovieSelect={handleMovieSelect} movies={movies} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <SelectedMovies
              selectedId={selectedId}
              onBackButonClick={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedList
                watched={watched}
                onMovieDelete={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔️</span> {message}
    </p>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ searchString, onSearch }) {
  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={searchString}
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onMovieSelect }) {
  return (
    <ul className="list">
      {movies?.map((movie) => (
        <Movie movie={movie} onMovieSelect={onMovieSelect} key={movie.imdbID} />
      ))}
    </ul>
  );
}

function Movie({ movie, onMovieSelect }) {
  return (
    <li key={movie.imdbID} onClick={() => onMovieSelect(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedList({ watched, onMovieDelete }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} onMovieDelete={onMovieDelete} />
      ))}
    </ul>
  );
}

function SelectedMovies({
  selectedId,
  onBackButonClick,
  onAddWatched,
  watched,
}) {
  const [details, setDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const watchedMovie = watched
    .map((movie) => movie.imdbId)
    .includes(selectedId);

  console.log(watchedMovie);

  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          onBackButonClick();
        }
      }

      document.addEventListener("keydown", callback);

      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [onBackButonClick]
  );

  useEffect(
    function () {
      async function fetchMovieDetails(selectedId) {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}&plot=full`
        );
        const data = await res.json();
        setDetails(data);
        setIsLoading(false);
      }
      fetchMovieDetails(selectedId);
      checkMovieWatched(selectedId);
    },
    [selectedId]
  );

  function checkMovieWatched(id) {
    // setIsMovieWatched(watchedMovie.length > 0 ? true : false);
  }

  const {
    Title: title,
    Released: released,
    Poster: poster,
    Genre: genre,
    imdbRating,
    Plot: plot,
    Runtime: runtime,
    Year: year,
    Actors: actors,
    Director: director,
  } = details;

  function handleWatchedList() {
    const newWatchedMovie = {
      imdbId: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    };

    onAddWatched(newWatchedMovie);
    onBackButonClick();
  }

  useEffect(
    function () {
      document.title = title;

      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onBackButonClick}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${title}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                <span>
                  {released} - {details.Runtime}
                </span>
              </p>
              <p>
                <span>{genre}</span>
              </p>
              <p>
                <span>⭐️ {imdbRating} IMDb Rating</span>
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {watchedMovie ? (
                <p>You already watched the movie</p>
              ) : (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                    key={selectedId}
                  />

                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleWatchedList}>
                      Add to watched
                    </button>
                  )}
                </>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(2)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovie({ movie, onMovieDelete }) {
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onMovieDelete(movie.imdbId)}
        >
          X
        </button>
      </div>
    </li>
  );
}
