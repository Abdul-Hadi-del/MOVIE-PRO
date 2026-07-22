import { useState, useEffect } from "react";
import { fetchMovieDetails, fetchReviews, addReview, fetchSimilarMovies } from "../api";
import { auth } from "../firebase";
import StarRating from "./StarRating";
import PersonPage from "./PersonPage";

export default function MovieDetail({ title, onClose, onToggleWatchlist, inWatchlist }) {
  const [viewTitle, setViewTitle] = useState(title);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState({ reviews: [], average_rating: null, count: 0 });
  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ourRecs, setOurRecs] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  useEffect(() => {
    setViewTitle(title);
  }, [title]);

  const loadReviews = (t) => {
    fetchReviews(t).then(setReviewData);
  };

  useEffect(() => {
    setLoading(true);
    fetchMovieDetails(viewTitle).then((res) => {
      setData(res);
      setLoading(false);
    });
    loadReviews(viewTitle);
    fetchSimilarMovies(viewTitle).then(setOurRecs);
    setMyRating(0);
    setMyReviewText("");
  }, [viewTitle]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (myRating === 0) return;
    setSubmitting(true);
    await addReview(viewTitle, myRating, myReviewText);
    setMyRating(0);
    setMyReviewText("");
    loadReviews(viewTitle);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center overflow-y-auto z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-3xl w-full my-8">
        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-yellow-400">{viewTitle}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <p className="text-zinc-400 p-6">Loading details...</p>
        ) : !data?.found ? (
          <p className="text-red-400 p-6">Could not load details for this movie.</p>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex gap-6 flex-col sm:flex-row">
              {data.details?.poster && (
                <img
                  src={data.details.poster}
                  alt={viewTitle}
                  className="w-40 rounded-lg self-center sm:self-start"
                />
              )}
              <div className="flex-1">
                <p className="text-zinc-400 text-sm mb-1">
                  {data.movie.year} · ⭐ {data.movie.rating} · {data.movie.genre}
                </p>
                {data.details?.director && (
                  <button
                    onClick={() => setSelectedPersonId(data.details.director.id)}
                    className="text-zinc-400 text-sm mb-1 hover:text-yellow-400 transition block"
                  >
                    Directed by <span className="underline">{data.details.director.name}</span>
                  </button>
                )}
                {reviewData.average_rating !== null && (
                  <p className="text-yellow-400 text-sm mb-3">
                    Community: {reviewData.average_rating.toFixed(1)} / 5 ({reviewData.count} review
                    {reviewData.count !== 1 ? "s" : ""})
                  </p>
                )}
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {data.details?.overview || "No overview available."}
                </p>
                <button
                  onClick={() => onToggleWatchlist(viewTitle)}
                  className={`mt-4 text-sm font-medium rounded-md px-4 py-2 transition ${
                    inWatchlist
                      ? "bg-zinc-800 text-yellow-400 border border-yellow-400"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  }`}
                >
                  {inWatchlist ? "✓ In Watchlist" : "+ Add to Watchlist"}
                </button>
              </div>
            </div>

            {data.details?.collection && (
              <div className="bg-zinc-800/40 border border-yellow-400/20 rounded-lg p-3 text-sm">
                🌌 Part of <span className="text-yellow-400 font-medium">{data.details.collection.name}</span> — check it out in the Franchises tab
              </div>
            )}

            {data.details?.box_office && (
              <div>
                <h3 className="font-semibold mb-3">💰 Box Office</h3>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-zinc-500 text-xs">Budget</p>
                      <p className="font-semibold">${(data.details.box_office.budget / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="text-zinc-600">vs</div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">Revenue</p>
                      <p className="font-semibold">${(data.details.box_office.revenue / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
            
            {data.details?.watch_providers && (
              <div>
                <h3 className="font-semibold mb-3">📺 Where to Watch</h3>
                <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4 space-y-3">
                  {data.details.watch_providers.stream?.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Stream</p>
                      <div className="flex flex-wrap gap-2">
                        {data.details.watch_providers.stream.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2 py-1.5">
                            <img src={p.logo} alt={p.name} className="w-6 h-6 rounded" />
                            <span className="text-xs">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.details.watch_providers.rent?.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Rent</p>
                      <div className="flex flex-wrap gap-2">
                        {data.details.watch_providers.rent.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2 py-1.5">
                            <img src={p.logo} alt={p.name} className="w-6 h-6 rounded" />
                            <span className="text-xs">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.details.watch_providers.buy?.length > 0 && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-2">Buy</p>
                      <div className="flex flex-wrap gap-2">
                        {data.details.watch_providers.buy.map((p) => (
                          <div key={p.name} className="flex items-center gap-2 bg-zinc-800 rounded-lg px-2 py-1.5">
                            <img src={p.logo} alt={p.name} className="w-6 h-6 rounded" />
                            <span className="text-xs">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!data.details.watch_providers.stream?.length &&
                    !data.details.watch_providers.rent?.length &&
                    !data.details.watch_providers.buy?.length && (
                      <p className="text-zinc-500 text-xs">No streaming info available for this movie.</p>
                    )}

                  <p className="text-zinc-600 text-xs pt-1">Data provided by JustWatch via TMDB</p>
                </div>
              </div>
            )}

                  {/* Bar comparison */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-14">Budget</span>
                      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-14">Revenue</span>
                      <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${data.details.box_office.is_hit ? "bg-green-500" : "bg-red-500"}`}
                          style={{
                            width: `${Math.min(
                              (data.details.box_office.revenue / data.details.box_office.budget) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={data.details.box_office.is_hit ? "text-green-400" : "text-red-400"}>
                      {data.details.box_office.is_hit ? "📈 Hit" : "📉 Flop"} · {data.details.box_office.roi_percent > 0 ? "+" : ""}
                      {data.details.box_office.roi_percent}% ROI
                    </span>
                    <span className="text-zinc-500 text-xs">
                      Profit: ${(data.details.box_office.profit / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            )}

            {data.details?.trailer_key && (
              <div>
                <h3 className="font-semibold mb-2">Trailer</h3>
                <div className="aspect-video">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${data.details.trailer_key}`}
                    title="Trailer"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {data.details?.cast?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Cast</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {data.details.cast.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => setSelectedPersonId(c.id)}
                      className="text-center w-20 shrink-0 cursor-pointer group"
                    >
                      {c.profile ? (
                        <img
                          src={c.profile}
                          alt={c.name}
                          className="w-20 h-20 rounded-full object-cover mx-auto group-hover:opacity-75 transition"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-800 mx-auto" />
                      )}
                      <p className="text-xs mt-1 truncate group-hover:text-yellow-400">{c.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{c.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.details?.similar?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Similar Movies</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {data.details.similar.map((s) => (
                    <div
                      key={s.title}
                      onClick={() => setViewTitle(s.title)}
                      className="w-24 shrink-0 cursor-pointer group"
                    >
                      {s.poster ? (
                        <img
                          src={s.poster}
                          alt={s.title}
                          className="w-24 rounded-md group-hover:opacity-75 transition"
                        />
                      ) : (
                        <div className="w-24 aspect-[2/3] bg-zinc-800 rounded-md" />
                      )}
                      <p className="text-xs mt-1 truncate group-hover:text-yellow-400">
                        {s.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ourRecs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">You Might Also Like (genre match)</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {ourRecs.map((m) => (
                    <div
                      key={m.title}
                      onClick={() => setViewTitle(m.title)}
                      className="w-24 shrink-0 cursor-pointer group"
                    >
                      {m.poster ? (
                        <img
                          src={m.poster}
                          alt={m.title}
                          className="w-24 rounded-md group-hover:opacity-75 transition"
                        />
                      ) : (
                        <div className="w-24 aspect-[2/3] bg-zinc-800 rounded-md" />
                      )}
                      <p className="text-xs mt-1 truncate group-hover:text-yellow-400">
                        {m.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Reviews</h3>

              {auth.currentUser && (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4 mb-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">Your rating:</span>
                    <StarRating rating={myRating} onChange={setMyRating} />
                  </div>
                  <textarea
                    value={myReviewText}
                    onChange={(e) => setMyReviewText(e.target.value)}
                    placeholder="Write a review (optional)..."
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    type="submit"
                    disabled={myRating === 0 || submitting}
                    className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black text-sm font-medium rounded-md px-4 py-1.5 transition"
                  >
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}

              {reviewData.reviews.length === 0 ? (
                <p className="text-zinc-500 text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {reviewData.reviews.map((r) => (
                    <div
                      key={r.user_id}
                      className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">
                          {r.user_email}
                        </span>
                        <StarRating rating={r.rating} readonly />
                      </div>
                      {r.review_text && (
                        <p className="text-zinc-400 text-sm mt-1">{r.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPersonId && (
        <PersonPage
          personId={selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
        />
      )}
    </div>
  );
}