export interface Message {
  role: string;
  content: string;
}

export class MistralClient {
  private readonly endpoint: string = 'https://api.mistral.ai/v1/chat/completions';
  private readonly model: string = 'mistral-large-latest';

  /**
   * Sends a chat completion request to Mistral API.
   * 
   * @param messages - Array of message objects with role and content.
   * @param apiKey - The Mistral API key.
   * @returns The content of the generated message.
   * @throws Error if the request fails or returns an invalid response.
   */
  public async chat(messages: Message[], apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('API Key is missing.');
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Mistral-ZDR': '1', // CRITICAL for sovereign architecture
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
        }),
      });

      if (!response.ok) {
        let errorDetail = response.statusText;
        try {
          const errorJson = await response.json();
          errorDetail = errorJson.message || errorDetail;
        } catch (e) {
          // Ignore JSON parse error for error response
        }
        throw new Error(`Mistral API Error [${response.status}]: ${errorDetail}`);
      }

      const data = await response.json();

      // Validate response structure
      if (
        data &&
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        data.choices[0].message &&
        typeof data.choices[0].message.content === 'string'
      ) {
        return data.choices[0].message.content;
      }

      throw new Error('Invalid response structure received from Mistral API.');
    } catch (error) {
      // Rethrow known errors, wrap unknown ones
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred in MistralClient.');
    }
  }
}