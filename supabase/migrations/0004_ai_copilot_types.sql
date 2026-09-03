do $$
begin
  begin
    alter type ai_artifact_type add value 'copilot_response';
  exception
    when duplicate_object then null;
  end;

  begin
    alter type ai_feature_key add value 'copilot_assistant';
  exception
    when undefined_object then null;
    when duplicate_object then null;
  end;
end $$;
