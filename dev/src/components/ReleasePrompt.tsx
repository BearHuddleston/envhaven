import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { getRecentTags } from '../actions/release';

interface ReleasePromptProps {
  onSubmit: (version: string) => void;
  onCancel: () => void;
}

export function ReleasePrompt({ onSubmit, onCancel }: ReleasePromptProps): React.ReactElement {
  const [version, setVersion] = useState('');
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecentTags().then(setRecentTags);
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      if (!version) {
        setError('Version required');
        return;
      }
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        setError('Format: X.Y.Z (e.g., 1.2.3)');
        return;
      }
      onSubmit(version);
      return;
    }

    if (key.backspace || key.delete) {
      setVersion((v) => v.slice(0, -1));
      setError(null);
      return;
    }

    if (/^[0-9.]$/.test(input)) {
      setVersion((v) => v + input);
      setError(null);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} flexDirection="column">
        <Text bold>Release</Text>
        <Text dimColor>Tags git → triggers Docker image + CLI binary builds</Text>
      </Box>

      {recentTags.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text dimColor>Recent tags:</Text>
          {recentTags.map((tag) => (
            <Text key={tag} dimColor>  {tag}</Text>
          ))}
        </Box>
      )}

      <Box>
        <Text>Version: </Text>
        <Text color="cyan">{version || '_'}</Text>
        <Text dimColor> (X.Y.Z)</Text>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Enter to confirm • Esc to cancel</Text>
      </Box>
    </Box>
  );
}
