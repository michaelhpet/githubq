type Props = {
  label: string;
};

export default function Tag(props: Props) {
  return (
    <span className="self-start flex items-center px-2 py-1 rounded-lg bg-paper text-sm text-dim">
      {props.label}
    </span>
  );
}
