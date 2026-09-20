import json
import os
import uuid
from typing import Any

import httpx
from litellm import CustomLLM
from litellm.llms.custom_llm import CustomLLMError
from litellm.types.utils import Choices, Message, ModelResponse, Usage


def _extract_request(messages: list[Any]) -> dict[str, Any]:
    if not messages:
        raise CustomLLMError(status_code=400, message="Missing JEV request payload")

    last = messages[-1]
    if not isinstance(last, dict):
        raise CustomLLMError(status_code=400, message="Invalid JEV request payload")

    content = last.get("content")
    if not isinstance(content, str):
        raise CustomLLMError(status_code=400, message="Invalid JEV request payload")

    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        raise CustomLLMError(status_code=400, message="Invalid JEV JSON payload") from exc

    if not isinstance(payload, dict):
        raise CustomLLMError(status_code=400, message="JEV payload must be an object")

    return payload


def _upstream_url(api_base: str | None) -> str:
    base = (
        api_base
        or os.getenv("TYPESAFE_API_BASE")
        or "https://api.typesafe.ai"
    ).rstrip("/")
    return f"{base}/v1/systemone"


def _upstream_key(api_key: str | None) -> str:
    key = api_key or os.getenv("TYPESAFE_API_KEY")
    if not key:
        raise CustomLLMError(
            status_code=500,
            message="TypeSafe upstream API key is not configured",
        )
    return key


def _error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return f"TypeSafe upstream returned HTTP {response.status_code}"

    if isinstance(payload, dict):
        for field in ("error", "detail", "message"):
            value = payload.get(field)
            if isinstance(value, str) and value:
                return value
            if isinstance(value, dict):
                return json.dumps(value, ensure_ascii=False)

    return f"TypeSafe upstream returned HTTP {response.status_code}"


def _model_response(payload: dict[str, Any]) -> ModelResponse:
    usage = payload.get("usage")
    usage = usage if isinstance(usage, dict) else {}

    input_tokens = usage.get("input_tokens", 0)
    output_tokens = usage.get("output_tokens", 0)

    input_tokens = input_tokens if isinstance(input_tokens, int) else 0
    output_tokens = output_tokens if isinstance(output_tokens, int) else 0

    resolved_model = payload.get("model")
    if not isinstance(resolved_model, str) or not resolved_model:
        resolved_model = "jev"

    return ModelResponse(
        id=f"jev-{uuid.uuid4().hex}",
        model=resolved_model,
        choices=[
            Choices(
                index=0,
                finish_reason="stop",
                message=Message(
                    role="assistant",
                    content=json.dumps(
                        payload,
                        ensure_ascii=False,
                        separators=(",", ":"),
                    ),
                ),
            )
        ],
        usage=Usage(
            prompt_tokens=input_tokens,
            completion_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        ),
    )


class JevTypeSafeProvider(CustomLLM):
    def completion(
        self,
        model: str,
        messages: list,
        api_base: str,
        custom_prompt_dict: dict,
        model_response: ModelResponse,
        print_verbose,
        encoding,
        api_key,
        logging_obj,
        optional_params: dict,
        acompletion=None,
        litellm_params=None,
        logger_fn=None,
        headers={},
        timeout=None,
        client=None,
    ) -> ModelResponse:
        payload = _extract_request(messages)
        key = _upstream_key(api_key)

        try:
            with httpx.Client(timeout=30.0) as http_client:
                response = http_client.post(
                    _upstream_url(api_base),
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise CustomLLMError(status_code=504, message="TypeSafe upstream timed out") from exc
        except httpx.RequestError as exc:
            raise CustomLLMError(status_code=502, message="TypeSafe upstream is unavailable") from exc

        if response.status_code >= 400:
            raise CustomLLMError(
                status_code=response.status_code,
                message=_error_message(response),
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise CustomLLMError(
                status_code=502,
                message="TypeSafe upstream returned invalid JSON",
            ) from exc

        if not isinstance(data, dict):
            raise CustomLLMError(
                status_code=502,
                message="TypeSafe upstream returned an invalid payload",
            )

        return _model_response(data)

    async def acompletion(
        self,
        model: str,
        messages: list,
        api_base: str,
        custom_prompt_dict: dict,
        model_response: ModelResponse,
        print_verbose,
        encoding,
        api_key,
        logging_obj,
        optional_params: dict,
        acompletion=None,
        litellm_params=None,
        logger_fn=None,
        headers={},
        timeout=None,
        client=None,
    ) -> ModelResponse:
        payload = _extract_request(messages)
        key = _upstream_key(api_key)

        try:
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                response = await http_client.post(
                    _upstream_url(api_base),
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise CustomLLMError(status_code=504, message="TypeSafe upstream timed out") from exc
        except httpx.RequestError as exc:
            raise CustomLLMError(status_code=502, message="TypeSafe upstream is unavailable") from exc

        if response.status_code >= 400:
            raise CustomLLMError(
                status_code=response.status_code,
                message=_error_message(response),
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise CustomLLMError(
                status_code=502,
                message="TypeSafe upstream returned invalid JSON",
            ) from exc

        if not isinstance(data, dict):
            raise CustomLLMError(
                status_code=502,
                message="TypeSafe upstream returned an invalid payload",
            )

        return _model_response(data)


jev_handler = JevTypeSafeProvider()
