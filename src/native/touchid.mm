/**
 * Touch ID Native Module for Node.js
 * Provides biometric authentication using macOS LocalAuthentication framework
 * 
 * @file touchid.mm
 * @author NeaByteLab
 * @version 1.0.0
 * @license MIT
 * 
 * @credits
 * This implementation is inspired by and builds upon the excellent work of:
 * - node-mac-auth by @codebytere (Shelley Vohr)
 *   GitHub: https://github.com/codebytere/node-mac-auth
 *   License: MIT
 * 
 * The authentication flow and LocalAuthentication framework usage patterns
 * are based on the node-mac-auth implementation, which provides a clean
 * and reliable approach to Touch ID integration on macOS.
 * 
 * @differences
 * - Enhanced with persistent caching across process restarts
 * - Added comprehensive device identifier retrieval
 * - Improved error handling and platform validation
 * - Extended with TypeScript support and modern ES modules
 * - Added JSDoc documentation and type safety
 */

#import <napi.h>
#import <LocalAuthentication/LocalAuthentication.h>
#import <Foundation/Foundation.h>
#import <IOKit/IOKitLib.h>
#import <sys/sysctl.h>

/**
 * No-op function for ThreadSafeFunction callback
 * Used as a placeholder when no actual callback is needed
 * 
 * @param info - NAPI callback information
 * @returns Undefined value
 */
Napi::Value NoOp(const Napi::CallbackInfo &info) {
  return info.Env().Undefined();
}

/**
 * Check if Touch ID authentication is available on this device
 * 
 * Evaluates whether the system supports Touch ID authentication and if the user
 * has enrolled biometric data. Falls back to device owner authentication if
 * biometrics are not available.
 * 
 * @param info - NAPI callback information
 * @returns Boolean indicating if Touch ID can be used
 * 
 * @throws Napi::Error if authentication check fails
 */
Napi::Boolean CanPromptTouchID(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
  bool can_evaluate = false;
    
  if (@available(macOS 10.12.2, *)) {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;
    
    if ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error]) {
      if (@available(macOS 10.13.2, *)) {
        can_evaluate = [context biometryType] == LABiometryTypeTouchID;
      } else {
        can_evaluate = true;
      }
    }
    
    if (!can_evaluate) {
      // Try device owner authentication as fallback
      can_evaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:&error];
    }
    }
    
  return Napi::Boolean::New(env, can_evaluate);
  }

/**
 * Get comprehensive biometric and device information
 * 
 * Retrieves detailed information about the device's biometric capabilities,
 * hardware identifiers, and system information. Includes device serial number,
 * hardware UUID, model information, and system version.
 * 
 * @param info - NAPI callback information
 * @returns Object containing biometric and device data
 * 
 * @throws Napi::Error if device information retrieval fails
 */
Napi::Object GetBiometricInfo(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
  Napi::Object result = Napi::Object::New(env);
  
  if (@available(macOS 10.12.2, *)) {
    LAContext *context = [[LAContext alloc] init];
    NSError *error = nil;
    
    // Check if biometrics are available
    BOOL canEvaluate = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&error];
    result.Set("biometricsAvailable", Napi::Boolean::New(env, canEvaluate));
    
    if (@available(macOS 10.13.2, *)) {
      // Get biometric type
      LABiometryType biometryType = [context biometryType];
      std::string biometryTypeStr;
      
      switch (biometryType) {
        case LABiometryTypeTouchID:
          biometryTypeStr = "TouchID";
          break;
        case LABiometryTypeFaceID:
          biometryTypeStr = "FaceID";
          break;
        case LABiometryTypeNone:
        default:
          biometryTypeStr = "None";
          break;
      }
      
      result.Set("biometryType", Napi::String::New(env, biometryTypeStr));
    }
    
    // Get device identifier (serial number) - safer approach
    NSString *serialNumber = @"Unknown";
    @try {
      io_service_t platformExpert = IOServiceGetMatchingService(kIOMasterPortDefault, IOServiceMatching("IOPlatformExpertDevice"));
      if (platformExpert) {
        CFTypeRef serialNumberAsCFString = IORegistryEntryCreateCFProperty(platformExpert, CFSTR("IOPlatformSerialNumber"), kCFAllocatorDefault, 0);
        if (serialNumberAsCFString) {
          serialNumber = (__bridge NSString *)serialNumberAsCFString;
          CFRelease(serialNumberAsCFString);
        }
        IOObjectRelease(platformExpert);
      }
    } @catch (NSException *exception) {
      serialNumber = @"Error";
    }
    
    std::string serialStr = [serialNumber UTF8String];
    result.Set("deviceSerial", Napi::String::New(env, serialStr));
    
    // Get device model - safer approach
    NSString *model = @"Unknown";
    @try {
      size_t len = 0;
      if (sysctlbyname("hw.model", NULL, &len, NULL, 0) == 0 && len > 0) {
        char *modelName = (char *)malloc(len);
        if (sysctlbyname("hw.model", modelName, &len, NULL, 0) == 0) {
          model = [NSString stringWithUTF8String:modelName];
        }
        free(modelName);
      }
    } @catch (NSException *exception) {
      model = @"Error";
    }
    
    std::string modelStr = [model UTF8String];
    result.Set("deviceModel", Napi::String::New(env, modelStr));
    
    // Get system version
    NSString *systemVersion = [[NSProcessInfo processInfo] operatingSystemVersionString] ?: @"Unknown";
    std::string versionStr = [systemVersion UTF8String];
    result.Set("systemVersion", Napi::String::New(env, versionStr));
    
    // Get unique device identifier (hardware UUID) - safer approach
    NSString *hardwareUUID = @"Unknown";
    @try {
      io_service_t platformExpert2 = IOServiceGetMatchingService(kIOMasterPortDefault, IOServiceMatching("IOPlatformExpertDevice"));
      if (platformExpert2) {
        CFTypeRef uuidAsCFString = IORegistryEntryCreateCFProperty(platformExpert2, CFSTR("IOPlatformUUID"), kCFAllocatorDefault, 0);
        if (uuidAsCFString) {
          hardwareUUID = (__bridge NSString *)uuidAsCFString;
          CFRelease(uuidAsCFString);
        }
        IOObjectRelease(platformExpert2);
      }
    } @catch (NSException *exception) {
      hardwareUUID = @"Error";
    }
    
    std::string uuidStr = [hardwareUUID UTF8String];
    result.Set("hardwareUUID", Napi::String::New(env, uuidStr));
    
  } else {
    result.Set("biometricsAvailable", Napi::Boolean::New(env, false));
    result.Set("biometryType", Napi::String::New(env, "Unsupported"));
    result.Set("deviceSerial", Napi::String::New(env, "Unsupported"));
    result.Set("deviceModel", Napi::String::New(env, "Unsupported"));
    result.Set("systemVersion", Napi::String::New(env, "Unsupported"));
    result.Set("hardwareUUID", Napi::String::New(env, "Unsupported"));
  }
  
  return result;
}

/**
 * Global cache state for authentication
 * 
 * Maintains authentication state across function calls to enable
 * cached authentication without requiring user interaction.
 */
static NSDate *lastAuthTime = nil;
static BOOL isCached = NO;
static NSTimeInterval cacheTTL = 30.0; // Default 30 seconds

/**
 * Get the file path for persistent cache storage
 * 
 * Returns the path to the cache file in the user's Documents directory.
 * The cache file stores authentication state for persistent caching.
 * 
 * @returns NSString containing the cache file path
 */
NSString* getCacheFilePath() {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *documentsDirectory = [paths objectAtIndex:0];
  return [documentsDirectory stringByAppendingPathComponent:@"touchid_cache.plist"];
}

/**
 * Load authentication cache from persistent storage
 * 
 * Reads the cache file and restores authentication state. Validates
 * cache expiration and clears invalid cache entries.
 * 
 * @throws NSException if cache file read fails
 */
void loadCache() {
  NSString *cachePath = getCacheFilePath();
  NSDictionary *cacheData = [NSDictionary dictionaryWithContentsOfFile:cachePath];
  
  if (cacheData) {
    lastAuthTime = [cacheData objectForKey:@"lastAuthTime"];
    isCached = [[cacheData objectForKey:@"isCached"] boolValue];
    cacheTTL = [[cacheData objectForKey:@"cacheTTL"] doubleValue];
    
    // Check if cache is still valid
    if (lastAuthTime && isCached) {
      NSTimeInterval timeSinceLastAuth = [[NSDate date] timeIntervalSinceDate:lastAuthTime];
      if (timeSinceLastAuth >= cacheTTL) {
        isCached = NO;
        lastAuthTime = nil;
      }
    }
  }
}

/**
 * Save authentication cache to persistent storage
 * 
 * Writes the current authentication state to the cache file for
 * persistent caching across application restarts.
 * 
 * @throws NSException if cache file write fails
 */
void saveCache() {
  NSString *cachePath = getCacheFilePath();
  NSDictionary *cacheData = @{
    @"lastAuthTime": lastAuthTime ?: [NSNull null],
    @"isCached": @(isCached),
    @"cacheTTL": @(cacheTTL)
  };
  [cacheData writeToFile:cachePath atomically:YES];
}

/**
 * Authenticate user using Touch ID biometric authentication
 * 
 * Prompts the user for Touch ID authentication with support for both
 * direct and cached authentication methods. Returns device identifiers
 * and authentication result.
 * 
 * @param info - NAPI callback information containing authentication options
 * @returns Promise that resolves with authentication result and device data
 * 
 * @throws Napi::Error if authentication fails or device info retrieval fails
 * 
 * @param options.reason - Human-readable reason for authentication request
 * @param options.method - Authentication method ('direct' or 'cached')
 * @param options.ttl - Time-to-live for cached authentication in milliseconds
 */
Napi::Promise PromptTouchID(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();
  Napi::Object data = info[0].As<Napi::Object>();

  std::string reason = "";
  std::string method = "direct";
  int ttl = 30000; // Default 30 seconds

  if (data.Has("reason"))
    reason = data.Get("reason").As<Napi::String>().Utf8Value();
  
  if (data.Has("method"))
    method = data.Get("method").As<Napi::String>().Utf8Value();
  
  if (data.Has("ttl"))
    ttl = data.Get("ttl").As<Napi::Number>().Int32Value();

  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
  Napi::ThreadSafeFunction ts_fn = Napi::ThreadSafeFunction::New(
      env, Napi::Function::New(env, NoOp), "authCallback", 0, 1);

  LAContext *context = [[LAContext alloc] init];

  // The app-provided reason for requesting authentication
  NSString *request_reason = [NSString stringWithUTF8String:reason.c_str()];

  // Load cache from file for persistent caching
  loadCache();

  // Check if we can use cached authentication
  BOOL useCache = NO;
  if (method == "cached") {
    cacheTTL = ttl / 1000.0;
    if (lastAuthTime && isCached) {
      NSTimeInterval timeSinceLastAuth = [[NSDate date] timeIntervalSinceDate:lastAuthTime];
      if (timeSinceLastAuth < cacheTTL) {
        useCache = YES;
      } else {
        isCached = NO;
      }
    }
  }

  // Choose authentication policy based on method
  LAPolicy policy;
  if (method == "cached" && !useCache) {
    policy = LAPolicyDeviceOwnerAuthenticationWithBiometrics;
    // Set touch ID authentication allow reuse
    [context setTouchIDAuthenticationAllowableReuseDuration:cacheTTL];
  } else {
    policy = LAPolicyDeviceOwnerAuthenticationWithBiometrics;
  }

  __block Napi::ThreadSafeFunction tsfn = ts_fn;
  
  // If using cache, resolve immediately
  if (useCache) {
    auto resolve_cb = [=](Napi::Env env, Napi::Function noop_cb) {
      Napi::Object result = Napi::Object::New(env);
      result.Set("success", Napi::Boolean::New(env, true));
      
      // Get device data - basic approach
      Napi::Object data = Napi::Object::New(env);
      
      // Get biometric info
      if (@available(macOS 10.12.2, *)) {
        LAContext *context2 = [[LAContext alloc] init];
        
        if (@available(macOS 10.13.2, *)) {
          LABiometryType biometryType = [context2 biometryType];
          std::string biometryTypeStr;
          
          switch (biometryType) {
            case LABiometryTypeTouchID:
              biometryTypeStr = "TouchID";
              break;
            case LABiometryTypeFaceID:
              biometryTypeStr = "FaceID";
              break;
            case LABiometryTypeNone:
            default:
              biometryTypeStr = "None";
              break;
          }
          
          data.Set("biometryType", Napi::String::New(env, biometryTypeStr));
        }
        
        // Get real device identifiers using system commands
        NSString *systemVersion = [[NSProcessInfo processInfo] operatingSystemVersionString] ?: @"Unknown";
        NSString *hardwareUUID = @"Unknown";
        NSString *deviceSerial = @"Unknown";
        NSString *deviceModel = @"Mac";
        
        // Get real hardware UUID using system command
        @try {
          NSTask *task = [[NSTask alloc] init];
          [task setLaunchPath:@"/usr/sbin/system_profiler"];
          [task setArguments:@[@"SPHardwareDataType", @"-xml"]];
          
          NSPipe *pipe = [NSPipe pipe];
          [task setStandardOutput:pipe];
          [task launch];
          [task waitUntilExit];
          
          NSData *data = [[pipe fileHandleForReading] readDataToEndOfFile];
          NSString *output = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
          
          if ([output containsString:@"platform_UUID"]) {
            NSRange range = [output rangeOfString:@"platform_UUID"];
            NSRange valueRange = [output rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output.length - range.location)];
            if (valueRange.location != NSNotFound) {
              NSRange endRange = [output rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output.length - valueRange.location)];
              if (endRange.location != NSNotFound) {
                NSRange uuidRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                hardwareUUID = [output substringWithRange:uuidRange];
              }
            }
          }
        } @catch (NSException *exception) {
          hardwareUUID = @"Error";
        }
        
        // Get real device serial using system command
        @try {
          NSTask *task2 = [[NSTask alloc] init];
          [task2 setLaunchPath:@"/usr/sbin/system_profiler"];
          [task2 setArguments:@[@"SPHardwareDataType", @"-xml"]];
          
          NSPipe *pipe2 = [NSPipe pipe];
          [task2 setStandardOutput:pipe2];
          [task2 launch];
          [task2 waitUntilExit];
          
          NSData *data2 = [[pipe2 fileHandleForReading] readDataToEndOfFile];
          NSString *output2 = [[NSString alloc] initWithData:data2 encoding:NSUTF8StringEncoding];
          
          if ([output2 containsString:@"serial_number"]) {
            NSRange range = [output2 rangeOfString:@"serial_number"];
            NSRange valueRange = [output2 rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output2.length - range.location)];
            if (valueRange.location != NSNotFound) {
              NSRange endRange = [output2 rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output2.length - valueRange.location)];
              if (endRange.location != NSNotFound) {
                NSRange serialRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                deviceSerial = [output2 substringWithRange:serialRange];
              }
            }
          }
        } @catch (NSException *exception) {
          deviceSerial = @"Error";
        }
        
        // Get real device model using system command
        @try {
          NSTask *task3 = [[NSTask alloc] init];
          [task3 setLaunchPath:@"/usr/sbin/system_profiler"];
          [task3 setArguments:@[@"SPHardwareDataType", @"-xml"]];
          
          NSPipe *pipe3 = [NSPipe pipe];
          [task3 setStandardOutput:pipe3];
          [task3 launch];
          [task3 waitUntilExit];
          
          NSData *data3 = [[pipe3 fileHandleForReading] readDataToEndOfFile];
          NSString *output3 = [[NSString alloc] initWithData:data3 encoding:NSUTF8StringEncoding];
          
          if ([output3 containsString:@"machine_model"]) {
            NSRange range = [output3 rangeOfString:@"machine_model"];
            NSRange valueRange = [output3 rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output3.length - range.location)];
            if (valueRange.location != NSNotFound) {
              NSRange endRange = [output3 rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output3.length - valueRange.location)];
              if (endRange.location != NSNotFound) {
                NSRange modelRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                deviceModel = [output3 substringWithRange:modelRange];
              }
            }
          }
        } @catch (NSException *exception) {
          deviceModel = @"Error";
        }
        
        data.Set("hardwareUUID", Napi::String::New(env, [hardwareUUID UTF8String]));
        data.Set("deviceSerial", Napi::String::New(env, [deviceSerial UTF8String]));
        data.Set("deviceModel", Napi::String::New(env, [deviceModel UTF8String]));
        data.Set("systemVersion", Napi::String::New(env, [systemVersion UTF8String]));
      }
      
      result.Set("data", data);
        deferred.Resolve(result);
    };
    
    tsfn.BlockingCall(resolve_cb);
    tsfn.Release();
    return deferred.Promise();
  }
  
  [context
       evaluatePolicy:policy
      localizedReason:request_reason
                reply:^(BOOL success, NSError *error) {
                  // Promise resolution callback
                  auto resolve_cb = [=](Napi::Env env, Napi::Function noop_cb) {
                    // Update cache state on successful authentication
                    if (method == "cached") {
                      lastAuthTime = [NSDate date];
                      isCached = YES;
                      saveCache(); // Save to persistent storage
                    }
                    
                    Napi::Object result = Napi::Object::New(env);
                    result.Set("success", Napi::Boolean::New(env, true));
                    
                    // Get device data - basic approach
                    Napi::Object data = Napi::Object::New(env);
                    
                    // Get biometric info
                    if (@available(macOS 10.12.2, *)) {
                      LAContext *context2 = [[LAContext alloc] init];
                      
                      if (@available(macOS 10.13.2, *)) {
                        LABiometryType biometryType = [context2 biometryType];
                        std::string biometryTypeStr;
                        
                        switch (biometryType) {
                          case LABiometryTypeTouchID:
                            biometryTypeStr = "TouchID";
                            break;
                          case LABiometryTypeFaceID:
                            biometryTypeStr = "FaceID";
                            break;
                          case LABiometryTypeNone:
                          default:
                            biometryTypeStr = "None";
                            break;
                        }
                        
                        data.Set("biometryType", Napi::String::New(env, biometryTypeStr));
                      }
                      
                      // Get real device identifiers using system commands
                      NSString *systemVersion = [[NSProcessInfo processInfo] operatingSystemVersionString] ?: @"Unknown";
                      NSString *hardwareUUID = @"Unknown";
                      NSString *deviceSerial = @"Unknown";
                      NSString *deviceModel = @"Mac";
                      
                      // Get real hardware UUID using system command
                      @try {
                        NSTask *task = [[NSTask alloc] init];
                        [task setLaunchPath:@"/usr/sbin/system_profiler"];
                        [task setArguments:@[@"SPHardwareDataType", @"-xml"]];
                        
                        NSPipe *pipe = [NSPipe pipe];
                        [task setStandardOutput:pipe];
                        [task launch];
                        [task waitUntilExit];
                        
                        NSData *data = [[pipe fileHandleForReading] readDataToEndOfFile];
                        NSString *output = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                        
                        if ([output containsString:@"platform_UUID"]) {
                          NSRange range = [output rangeOfString:@"platform_UUID"];
                          NSRange valueRange = [output rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output.length - range.location)];
                          if (valueRange.location != NSNotFound) {
                            NSRange endRange = [output rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output.length - valueRange.location)];
                            if (endRange.location != NSNotFound) {
                              NSRange uuidRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                              hardwareUUID = [output substringWithRange:uuidRange];
                            }
                          }
                        }
                      } @catch (NSException *exception) {
                        hardwareUUID = @"Error";
                      }
                      
                      // Get real device serial using system command
                      @try {
                        NSTask *task2 = [[NSTask alloc] init];
                        [task2 setLaunchPath:@"/usr/sbin/system_profiler"];
                        [task2 setArguments:@[@"SPHardwareDataType", @"-xml"]];
                        
                        NSPipe *pipe2 = [NSPipe pipe];
                        [task2 setStandardOutput:pipe2];
                        [task2 launch];
                        [task2 waitUntilExit];
                        
                        NSData *data2 = [[pipe2 fileHandleForReading] readDataToEndOfFile];
                        NSString *output2 = [[NSString alloc] initWithData:data2 encoding:NSUTF8StringEncoding];
                        
                        if ([output2 containsString:@"serial_number"]) {
                          NSRange range = [output2 rangeOfString:@"serial_number"];
                          NSRange valueRange = [output2 rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output2.length - range.location)];
                          if (valueRange.location != NSNotFound) {
                            NSRange endRange = [output2 rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output2.length - valueRange.location)];
                            if (endRange.location != NSNotFound) {
                              NSRange serialRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                              deviceSerial = [output2 substringWithRange:serialRange];
                            }
                          }
                        }
                      } @catch (NSException *exception) {
                        deviceSerial = @"Error";
                      }
                      
                      // Get real device model using system command
                      @try {
                        NSTask *task3 = [[NSTask alloc] init];
                        [task3 setLaunchPath:@"/usr/sbin/system_profiler"];
                        [task3 setArguments:@[@"SPHardwareDataType", @"-xml"]];
                        
                        NSPipe *pipe3 = [NSPipe pipe];
                        [task3 setStandardOutput:pipe3];
                        [task3 launch];
                        [task3 waitUntilExit];
                        
                        NSData *data3 = [[pipe3 fileHandleForReading] readDataToEndOfFile];
                        NSString *output3 = [[NSString alloc] initWithData:data3 encoding:NSUTF8StringEncoding];
                        
                        if ([output3 containsString:@"machine_model"]) {
                          NSRange range = [output3 rangeOfString:@"machine_model"];
                          NSRange valueRange = [output3 rangeOfString:@"<string>" options:0 range:NSMakeRange(range.location, output3.length - range.location)];
                          if (valueRange.location != NSNotFound) {
                            NSRange endRange = [output3 rangeOfString:@"</string>" options:0 range:NSMakeRange(valueRange.location, output3.length - valueRange.location)];
                            if (endRange.location != NSNotFound) {
                              NSRange modelRange = NSMakeRange(valueRange.location + 8, endRange.location - valueRange.location - 8);
                              deviceModel = [output3 substringWithRange:modelRange];
                            }
                          }
                        }
                      } @catch (NSException *exception) {
                        deviceModel = @"Error";
                      }
                      
                      data.Set("hardwareUUID", Napi::String::New(env, [hardwareUUID UTF8String]));
                      data.Set("deviceSerial", Napi::String::New(env, [deviceSerial UTF8String]));
                      data.Set("deviceModel", Napi::String::New(env, [deviceModel UTF8String]));
                      data.Set("systemVersion", Napi::String::New(env, [systemVersion UTF8String]));
                    }
                    
                    result.Set("data", data);
                    deferred.Resolve(result);
                  };

                  // Promise rejection callback
                  auto reject_cb = [=](Napi::Env env, Napi::Function noop_cb,
                                       const char *error) {
                    deferred.Reject(Napi::String::New(env, error));
                  };

                  if (error) {
                    const char *err_str =
                        [error.localizedDescription UTF8String];
                    tsfn.BlockingCall(err_str, reject_cb);
                  } else {
                    tsfn.BlockingCall(resolve_cb);
                  };
                  tsfn.Release();
                }];

  return deferred.Promise();
}

/**
 * Initialize the native module and expose functions to JavaScript
 * 
 * Registers all native functions with the Node.js module system.
 * This function is called when the module is loaded.
 * 
 * @param env - NAPI environment
 * @param exports - Module exports object
 * @returns Object containing all exported functions
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "canPromptTouchID"), Napi::Function::New(env, CanPromptTouchID));
  exports.Set(Napi::String::New(env, "promptTouchID"), Napi::Function::New(env, PromptTouchID));
  exports.Set(Napi::String::New(env, "getBiometricInfo"), Napi::Function::New(env, GetBiometricInfo));
  return exports;
}

/**
 * Node.js module registration
 * 
 * Registers the native module with Node.js using the N-API module system.
 * The module name 'touchid_native' must match the binding.gyp configuration.
 */
NODE_API_MODULE(touchid_native, Init) 