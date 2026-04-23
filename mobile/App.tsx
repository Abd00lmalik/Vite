import 'react-native-get-random-values';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen }     from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RegisterScreen }  from './src/screens/RegisterScreen';
import { VaccinateScreen } from './src/screens/VaccinateScreen';
import { SyncScreen }      from './src/screens/SyncScreen';
import { RecordsScreen }   from './src/screens/RecordsScreen';
import { StatusBar }       from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#005EB8" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle:      { backgroundColor: '#005EB8' },
          headerTintColor:  '#FFFFFF',
          headerTitleStyle: {
            fontWeight:    'bold',
            fontSize:      17,
          },
          contentStyle:           { backgroundColor: '#F7F9FC' },
          headerTitleAlign:       'center',
          headerBackTitleVisible: false,
          headerShadowVisible:    false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Vite Dashboard', headerLeft: () => null }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Register Patient' }}
        />
        <Stack.Screen
          name="Vaccinate"
          component={VaccinateScreen}
          options={{ title: 'Record Vaccination' }}
        />
        <Stack.Screen
          name="Sync"
          component={SyncScreen}
          options={{ title: 'Sync to XION' }}
        />
        <Stack.Screen
          name="Records"
          component={RecordsScreen}
          options={{ title: 'Patient Records' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



