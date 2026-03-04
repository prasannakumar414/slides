export default function Slide({ html, index, total }) {
  return (
    <div className="slide">
      <div
        className="slide-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="slide-number">
        {index + 1} / {total}
      </div>
    </div>
  );
}
