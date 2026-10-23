// Tick boxes (or radio buttons) shown as chips.
export function ChoiceChips({ name, options, register, type = "checkbox" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label }) => (
        <label
          key={value}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-secondary has-checked:font-medium has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
        >
          <input type={type} value={value} className="size-4 accent-primary" {...register(name)} />
          {label}
        </label>
      ))}
    </div>
  );
}
