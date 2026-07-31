def format_class_name(class_name: str) -> str:
  """
  Change class names from format snake_case to Title Case.
  Example: "puller_pork_sandwitch" -> "Puller Pork Sandwitch"
  """
  return class_name.replace("_", " ").strip().title()