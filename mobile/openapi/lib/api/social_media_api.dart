//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SocialMediaApi {
  SocialMediaApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /social-media' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateSocialMediaDto] createSocialMediaDto (required):
  Future<Response> createSocialMediaWithHttpInfo(CreateSocialMediaDto createSocialMediaDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/social-media';

    // ignore: prefer_final_locals
    Object? postBody = createSocialMediaDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [CreateSocialMediaDto] createSocialMediaDto (required):
  Future<SocialMediaResponseDto?> createSocialMedia(CreateSocialMediaDto createSocialMediaDto,) async {
    final response = await createSocialMediaWithHttpInfo(createSocialMediaDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SocialMediaResponseDto',) as SocialMediaResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /social-media' operation and returns the [Response].
  Future<Response> getAllSocialMediaWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/social-media';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  Future<List<SocialMediaResponseDto>?> getAllSocialMedia() async {
    final response = await getAllSocialMediaWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SocialMediaResponseDto>') as List)
        .cast<SocialMediaResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'GET /social-media/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSocialMediaByIdWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/social-media/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<SocialMediaResponseDto?> getSocialMediaById(String id,) async {
    final response = await getSocialMediaByIdWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SocialMediaResponseDto',) as SocialMediaResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /social-media/person/{personId}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] personId (required):
  Future<Response> getSocialMediaByPersonIdWithHttpInfo(String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/social-media/person/{personId}'
      .replaceAll('{personId}', personId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] personId (required):
  Future<List<SocialMediaResponseDto>?> getSocialMediaByPersonId(String personId,) async {
    final response = await getSocialMediaByPersonIdWithHttpInfo(personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SocialMediaResponseDto>') as List)
        .cast<SocialMediaResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'PUT /social-media/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateSocialMediaDto] updateSocialMediaDto (required):
  Future<Response> updateSocialMediaWithHttpInfo(String id, UpdateSocialMediaDto updateSocialMediaDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/social-media/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateSocialMediaDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateSocialMediaDto] updateSocialMediaDto (required):
  Future<SocialMediaResponseDto?> updateSocialMedia(String id, UpdateSocialMediaDto updateSocialMediaDto,) async {
    final response = await updateSocialMediaWithHttpInfo(id, updateSocialMediaDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SocialMediaResponseDto',) as SocialMediaResponseDto;
    
    }
    return null;
  }
}
