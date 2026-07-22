export default function StarRating({ rating, onChange, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`text-xl leading-none ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition"
          } ${star <= rating ? "text-yellow-400" : "text-zinc-600"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}