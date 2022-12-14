import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { Agenda } from "react-native-calendars";

import { app } from "./firebaseConfig";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

import {
  NavigationContainer,
  useNavigation,
  useIsFocused,
  useRoute,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";

import DateTimePicker from "@react-native-community/datetimepicker";

import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const Stack = createNativeStackNavigator();
const Tab = createMaterialBottomTabNavigator();

const CreateScreen = () => {
  const isFocused = useIsFocused();

  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [show, setShow] = useState(true);
  const [text, setText] = useState("");
  const [uid, setUid] = useState("");

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      // console.log(JSON.stringify(user, null, 2));
      console.log(user.email);

      if (user?.uid) {
        setUid(user?.email);
      }
    });

    return () => unsubscribe();
  }, [isFocused]);

  const setData = async (collectionId, date, content) => {
    if (!collectionId || !date) {
      return console.error(
        "CreateScreen: setData(): collectionId or date is null"
      );
    }

    const db = getFirestore(app);

    const currentFirestoreRef = doc(db, collectionId, date);
    const docSnap = await getDoc(currentFirestoreRef);

    if (docSnap.exists()) {
      await updateDoc(currentFirestoreRef, {
        data: arrayUnion(content),
      });

      console.log("????????? ????????????");
    } else {
      try {
        await setDoc(doc(db, collectionId, date), {
          data: [content],
        });
        console.log("???????????? ?????? ?????????~");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const createEvent = async (content: string) => {
    if (!content) {
      return Alert.alert("??????", "????????? ??????????????????!");
    }

    await getData(uid, convertDate(date));

    console.log("uid: " + uid);
    console.log("date: " + convertDate(date));

    await setData(uid, convertDate(date), text);
  };

  const getData = async (uid: string, date: string) => {
    const db = getFirestore(app);

    const querySnapshot = await getDocs(collection(db, uid));

    const currentSize = querySnapshot.size;

    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => `);
      console.log(doc.data());
    });

    if (!currentSize) {
      console.log("?????? ??????");
    } else {
      console.log("?????? ??????.");
    }
  };

  // YYYY-MM-DD
  const convertDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}-${month <= 10 ? "0" + month : month}-${
      day <= 10 ? "0" + day : day
    }`;
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;

    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    if (Platform.OS === "android") {
      setShow(false);
    }

    setMode(currentMode);
    setShow(true);
  };

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <View style={{ height: 40 }} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 25 }} />

        <Text>????????? ???: {convertDate(date)}</Text>
      </View>

      <View style={{ height: 20 }} />

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          is24Hour={true}
          onChange={onChange}
        />
      )}

      <View style={{ height: 40 }} />

      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1, width: 300 }}
        onChange={(event) => {
          setText(event.nativeEvent.text);
        }}
        value={text}
      />

      <View style={{ height: 40 }} />

      <Pressable
        disabled={!text.length}
        onPressIn={() => {
          createEvent(text);

          Alert.alert(
            "??????",
            `${convertDate(date)}, "${text}"??? ?????? ????????? ?????????????????????!`
          );

          setText("");
        }}
      >
        <View
          style={{
            width: Dimensions.get("window").width * 0.8,
            height: 100,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: text.length ? "lightblue" : "#666",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", color: "white" }}>
            ?????? ?????????
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const HomeScreen = () => {
  const isFocused = useIsFocused();

  const db = getFirestore(app);

  const [uid, setUid] = useState("");
  const [final, setFinal] = useState({});

  const route = useRoute();

  console.log("route?.params?.uid: " + route?.params?.uid);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setUid(user?.email);
      }
    });

    return () => unsubscribe();
  }, [isFocused]);

  const getData = async (uid) => {
    const tempObj = {};

    if (route?.params?.uid) {
      const querySnapshot = await getDocs(collection(db, route?.params?.uid));

      querySnapshot.forEach((doc) => {
        Object.assign(tempObj, { [doc.id]: doc.data().data });

        console.log(`${doc.id} => `);
        console.log(doc.data());
      });

      setFinal(tempObj);
    } else {
      if (uid) {
        const querySnapshot = await getDocs(collection(db, uid));

        querySnapshot.forEach((doc) => {
          Object.assign(tempObj, { [doc.id]: doc.data().data });

          console.log(`${doc.id} => `);
          console.log(doc.data());
        });

        setFinal(tempObj);
      } else {
        console.log("In the HomeScreen");
        console.log("No uid");
      }
    }
  };

  useEffect(() => {
    const inner = async () => {
      console.log("Called uid: " + uid);
      await getData(uid);
    };

    inner();
  }, [isFocused, uid, route?.params?.uid]);

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();

    return `${year}-${month <= 10 ? "0" + month : month}-${
      date <= 10 ? "0" + date : date
    }`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <Agenda
        selected={getToday()}
        items={final}
        renderItem={(item, isFirst) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>{item?.toString()}</Text>
          </TouchableOpacity>
        )}
        renderEmptyData={() => {
          return (
            <>
              <View style={{ height: 225 }} />
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 24, fontWeight: "700" }}>
                  ????????? ?????????!
                </Text>
              </View>
            </>
          );
        }}
        onDayPress={(day) => {
          console.log("day changed", day);
        }}
      />
    </SafeAreaView>
  );
};

const BeforeSignUpScreen = () => {
  const auth = getAuth(app);

  // auth.signOut();

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.uid) {
        navigation.navigate("Home");
      } else {
        navigation.navigate("SignUp");
      }
    });

    return () => unsubscribe();
  }, [isFocused]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "bold" }}>
        ?????????! ???????????? ???????
      </Text>
    </View>
  );
};

const SignUpScreen = () => {
  const auth = getAuth(app);
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log(userCredential.user);

      navigation.navigate("Home");
    } catch (error) {
      Alert.alert(
        "??????",
        "????????? ???????????????, ????????? ????????? ?????? ?????????, ????????? ??????????????? ??????????????????!"
      );

      const errorCode = error.code;
      const errorMessage = error.message;

      console.log("errorCode:" + errorCode);
      console.log("errorMessage:" + errorMessage);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "lightblue" }}>
        ???????????? ????????????!?
      </Text>
      <View style={{ height: 40 }} />

      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1, width: 300 }}
        placeholder={"xyz@xyz.com"}
        onChange={(event) => {
          setEmail(event.nativeEvent.text);
        }}
        autoCapitalize={"none"}
      />

      <View style={{ height: 40 }} />

      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1, width: 300 }}
        placeholder={"??????????????? ?????????!"}
        secureTextEntry
        onChange={(event) => {
          setPassword(event.nativeEvent.text);
        }}
        autoCapitalize={"none"}
      />

      <View style={{ height: 40 }} />

      <Pressable
        onPressIn={() => {
          signUp(email, password);
        }}
        disabled={!email || !password}
      >
        <View
          style={{
            width: 300,
            height: 50,
            borderRadius: 20,
            backgroundColor: email && password ? "lightblue" : "#666",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
            ???????????? ?????????!
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const ShareScreen = () => {
  const auth = getAuth(app);

  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [uid, setUid] = useState("");
  const [tempUid, setTempUid] = useState("");
  const [typedUid, setTypeUid] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.uid) {
        setTempUid(user?.email);
      }
    });

    return () => unsubscribe();
  }, [isFocused]);

  const setRealUid = () => {
    setUid(tempUid ?? "??????, ???????????? ??????! ?????? ??????!");
  };

  const viewBFCalendar = () => {
    setRealUid("");
    setTempUid("");
    setTypeUid("");

    if (!typedUid) {
      return Alert.alert("??????", "??????! ????????? ???????????? ???????????? ?????????!");
    }

    navigation.navigate("Home", { uid: typedUid });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "lightblue" }}>
        ????????? ????????? ???????????????, ?????? ??????!
      </Text>
      <View style={{ height: 40 }} />

      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1, width: 300 }}
        placeholder={
          "????????? ????????? ?????????, ???????????? ????????? ??? ?????? ???????????? ??????!"
        }
        autoCapitalize={"none"}
        value={uid}
      />

      <View style={{ height: 20 }} />

      <Pressable
        onPressIn={() => {
          setRealUid();
        }}
      >
        <View
          style={{
            width: 300,
            height: 50,
            borderRadius: 20,
            backgroundColor: "lightblue",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
            ?????? ??????, ???????????? ??????!
          </Text>
        </View>
      </Pressable>

      <View style={{ height: 40 }} />

      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1, width: 300 }}
        placeholder={"???????????? ?????? ?????? ???????????? ?????????~"}
        autoCapitalize={"none"}
        value={typedUid}
        onChange={(event) => {
          setTypeUid(event.nativeEvent.text);
          console.log(typedUid);
        }}
      />

      <View style={{ height: 40 }} />

      <Pressable
        onPressIn={() => {
          viewBFCalendar();
        }}
      >
        <View
          style={{
            width: 300,
            height: 50,
            borderRadius: 20,
            backgroundColor: "lightblue",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
            ?????????! ????????? ????????? ??????!
          </Text>
        </View>
      </Pressable>

      <View style={{ height: 40 }} />

      <Pressable
        onPressIn={() => {
          navigation.navigate("Home");

          setRealUid("");
          setTempUid("");
          setTypeUid("");
        }}
      >
        <View
          style={{
            width: 300,
            height: 50,
            borderRadius: 20,
            backgroundColor: "lightblue",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
            ??? ???????????? ?????? ?????????!
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="BeforeSignUp"
          component={BeforeSignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Home" component={MyTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MyTabBar({ state, descriptors, navigation }) {
  return (
    <>
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 30 }} />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // The `merge: true` option makes sure that the params inside the tab screen are preserved
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{ flex: 1 }}
            >
              <Text style={{ color: isFocused ? "#673ab7" : "#222" }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 50 }} />
      </View>
    </>
  );
}

function MyTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MyTabBar {...props} />}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />

      <Tab.Screen
        name="Create"
        component={CreateScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="bag-suitcase"
              color={color}
              size={26}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Share"
        component={ShareScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  item: {
    backgroundColor: "white",
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  itemText: {
    color: "#888",
    fontSize: 16,
  },
});
