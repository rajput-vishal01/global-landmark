/**
 * The asterisk on a mandatory field's label.
 *
 * Purely visual, hence aria-hidden: the input's own `required` attribute is
 * what a screen reader announces, and reading "star" after every label adds
 * noise without adding information. One component so the mark cannot drift
 * in colour or spacing between the public forms and the admin panel — and
 * so "which fields are mandatory" stays a question with one answer per
 * form, checked against the `required` attribute next to it.
 */
export function Req() {
  return (
    <span aria-hidden className="text-error">
      {" "}
      *
    </span>
  );
}
