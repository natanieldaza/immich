//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SitesURLApi {
  SitesURLApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /sites-url' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SitesUrlCreateDto] sitesUrlCreateDto (required):
  Future<Response> createSitesUrlWithHttpInfo(SitesUrlCreateDto sitesUrlCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url';

    // ignore: prefer_final_locals
    Object? postBody = sitesUrlCreateDto;

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
  /// * [SitesUrlCreateDto] sitesUrlCreateDto (required):
  Future<SitesUrlResponseDto?> createSitesUrl(SitesUrlCreateDto sitesUrlCreateDto,) async {
    final response = await createSitesUrlWithHttpInfo(sitesUrlCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SitesUrlResponseDto',) as SitesUrlResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /sites-url/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteSitesUrlWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
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
  Future<SitesUrlResponseDto?> deleteSitesUrl(String id,) async {
    final response = await deleteSitesUrlWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SitesUrlResponseDto',) as SitesUrlResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /sites-url/download/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> downloadSitesUrlWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/download/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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
  Future<void> downloadSitesUrl(String id,) async {
    final response = await downloadSitesUrlWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /sites-url' operation and returns the [Response].
  Future<Response> getAllSitesUrlWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url';

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

  Future<List<SitesUrlResponseDto>?> getAllSitesUrl() async {
    final response = await getAllSitesUrlWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SitesUrlResponseDto>') as List)
        .cast<SitesUrlResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'GET /sites-url/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSitesUrlByIdWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/{id}'
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
  Future<SitesUrlResponseDto?> getSitesUrlById(String id,) async {
    final response = await getSitesUrlByIdWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SitesUrlResponseDto',) as SitesUrlResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /sites-url/url' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] url (required):
  Future<Response> getSitesUrlByUrlWithHttpInfo(String url,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/url';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'url', url));

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
  /// * [String] url (required):
  Future<SitesUrlResponseDto?> getSitesUrlByUrl(String url,) async {
    final response = await getSitesUrlByUrlWithHttpInfo(url,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SitesUrlResponseDto',) as SitesUrlResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /sites-url/start-download' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] preference (required):
  Future<Response> startLoopWithHttpInfo(num preference,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/start-download'
      .replaceAll('{preference}', preference.toString());

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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
  /// * [num] preference (required):
  Future<void> startLoop(num preference,) async {
    final response = await startLoopWithHttpInfo(preference,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /sites-url/stop-download' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] preference (required):
  Future<Response> stopLoopWithHttpInfo(num preference,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/stop-download'
      .replaceAll('{preference}', preference.toString());

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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
  /// * [num] preference (required):
  Future<void> stopLoop(num preference,) async {
    final response = await stopLoopWithHttpInfo(preference,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'PUT /sites-url/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SitesUrlUpdateDto] sitesUrlUpdateDto (required):
  Future<Response> updateSitesUrlWithHttpInfo(String id, SitesUrlUpdateDto sitesUrlUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sites-url/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sitesUrlUpdateDto;

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
  /// * [SitesUrlUpdateDto] sitesUrlUpdateDto (required):
  Future<SitesUrlResponseDto?> updateSitesUrl(String id, SitesUrlUpdateDto sitesUrlUpdateDto,) async {
    final response = await updateSitesUrlWithHttpInfo(id, sitesUrlUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SitesUrlResponseDto',) as SitesUrlResponseDto;
    
    }
    return null;
  }
}
