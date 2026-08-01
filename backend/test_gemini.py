from services.llm import client

response = client.models.generate_content(
model="gemini-3.5-flash",
    contents="Say hello in one sentence."
)

print(response.text)